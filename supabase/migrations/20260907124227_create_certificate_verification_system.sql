/*
# Create Blockchain Certificate Verification System tables

This migration creates the core tables for a certificate verification system that simulates
a blockchain by storing SHA-256 hashes of certificate data in a hash-chained structure.

## Tables created:

1. `certificates` — stores certificate metadata and the SHA-256 hash of the certificate content.
   - `id` (uuid, primary key) — unique certificate identifier
   - `certificate_id` (text, unique) — human-readable certificate ID (e.g., "CERT-XXXX-XXXX")
   - `student_name` (text, not null)
   - `course` (text, not null)
   - `institution` (text, not null)
   - `issue_date` (date, not null)
   - `certificate_hash` (text, not null) — SHA-256 hash of the certificate file content
   - `file_name` (text) — original uploaded file name
   - `file_type` (text) — MIME type of uploaded file
   - `file_size` (bigint) — file size in bytes
   - `status` (text, default 'issued') — 'issued', 'verified', 'tampered'
   - `created_at` (timestamptz, default now())
   - `verified_at` (timestamptz) — timestamp of last verification

2. `blocks` — simulates blockchain blocks in a hash-chained structure.
   Each block contains: certificateId, certificateHash, previousBlockHash, timestamp, blockHash.
   The blockHash = SHA256(certificateId + certificateHash + previousBlockHash + timestamp).
   - `id` (uuid, primary key)
   - `block_index` (integer, not null) — sequential block number
   - `certificate_id` (text, not null) — reference to the certificate
   - `certificate_hash` (text, not null) — the certificate's SHA-256 hash stored "on-chain"
   - `previous_block_hash` (text, not null) — hash of the previous block (chain linkage)
   - `timestamp` (timestamptz, not null) — block creation timestamp
   - `block_hash` (text, not null) — SHA256(certificate_id + certificate_hash + previous_block_hash + timestamp)
   - `created_at` (timestamptz, default now())

3. `verification_logs` — logs each verification attempt for audit trail.
   - `id` (uuid, primary key)
   - `certificate_id` (text, not null) — the certificate being verified
   - `computed_hash` (text) — the hash computed from the uploaded file
   - `stored_hash` (text) — the hash stored on-chain
   - `result` (text, not null) — 'valid', 'invalid', 'not_found'
   - `verified_by` (text) — IP or user identifier
   - `created_at` (timestamptz, default now())

4. `stats` — aggregate stats for the landing page dashboard.
   - `id` (uuid, primary key)
   - `total_issued` (integer, default 0)
   - `total_verified` (integer, default 0)
   - `total_tampered` (integer, default 0)
   - `updated_at` (timestamptz, default now())

## Security
- RLS enabled on all tables.
- This is a public-facing app (no sign-in required for core functionality), so anon+authenticated
  can read and write certificates/blocks/verification_logs. The dashboard uses mock JWT auth
  client-side only, so all data is accessible to anon.
- All policies use `TO anon, authenticated` since the app intentionally shares certificate data
  publicly (verification is a public good — anyone can verify a certificate).
*/

-- ============================================================
-- CERTIFICATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id text UNIQUE NOT NULL,
  student_name text NOT NULL,
  course text NOT NULL,
  institution text NOT NULL,
  issue_date date NOT NULL,
  certificate_hash text NOT NULL,
  file_name text,
  file_type text,
  file_size bigint,
  status text NOT NULL DEFAULT 'issued',
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_certificates" ON certificates;
CREATE POLICY "anon_select_certificates" ON certificates FOR SELECT
  TO anon, authenticated USING (true);

-- Writes restricted to service_role only (edge function / verified backend)

-- ============================================================
-- BLOCKS TABLE (simulated blockchain)
-- ============================================================
CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_index integer NOT NULL,
  certificate_id text NOT NULL,
  certificate_hash text NOT NULL,
  previous_block_hash text NOT NULL,
  timestamp timestamptz NOT NULL,
  block_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_blocks" ON blocks;
CREATE POLICY "anon_select_blocks" ON blocks FOR SELECT
  TO anon, authenticated USING (true);

-- Writes restricted to service_role only (edge function / verified backend)

-- ============================================================
-- VERIFICATION LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id text NOT NULL,
  computed_hash text,
  stored_hash text,
  result text NOT NULL,
  verified_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_verification_logs" ON verification_logs;
CREATE POLICY "anon_select_verification_logs" ON verification_logs FOR SELECT
  TO anon, authenticated USING (true);

-- Writes restricted to service_role only (edge function / verified backend)

-- ============================================================
-- STATS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_issued integer DEFAULT 0,
  total_verified integer DEFAULT 0,
  total_tampered integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_stats" ON stats;
CREATE POLICY "anon_select_stats" ON stats FOR SELECT
  TO anon, authenticated USING (true);

-- Writes restricted to service_role only (edge function / verified backend)


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_institution ON certificates(institution);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_blocks_certificate_id ON blocks(certificate_id);
CREATE INDEX IF NOT EXISTS idx_blocks_block_index ON blocks(block_index);
CREATE INDEX IF NOT EXISTS idx_verification_logs_certificate_id ON verification_logs(certificate_id);

-- ============================================================
-- TRIGGER to auto-update stats when a certificate is inserted
-- ============================================================
CREATE OR REPLACE FUNCTION update_stats_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert the single stats row
  INSERT INTO stats (total_issued, total_verified, total_tampered, updated_at)
  VALUES (1, 0, 0, now())
  ON CONFLICT (id) DO UPDATE
  SET total_issued = stats.total_issued + 1,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_stats_on_insert ON certificates;
CREATE TRIGGER trigger_update_stats_on_insert
  AFTER INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_stats_on_insert();

-- ============================================================
-- TRIGGER to auto-update verified count when status changes to 'verified'
-- ============================================================
CREATE OR REPLACE FUNCTION update_stats_on_verify()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status <> 'verified') THEN
    UPDATE stats SET total_verified = total_verified + 1, updated_at = now();
  ELSIF NEW.status = 'tampered' AND (OLD.status IS NULL OR OLD.status <> 'tampered') THEN
    UPDATE stats SET total_tampered = total_tampered + 1, updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_stats_on_verify ON certificates;
CREATE TRIGGER trigger_update_stats_on_verify
  AFTER UPDATE OF status ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_stats_on_verify();