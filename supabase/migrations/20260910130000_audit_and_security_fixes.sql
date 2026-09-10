/*
# Deep Security Audit & Complete Fixes: Strict RLS, Audit Logging & Tamper Prevention

## Summary of Fixes:
1. Cleanse and revoke all legacy permissive policies (anon_insert, anon_update, anon_delete) on certificates, blocks, verification_logs, and stats.
2. Prevent user privilege escalation on `users` table via strict trigger (users cannot change their own role or status).
3. Enforce cryptographic blockchain ledger immutability on `blocks` table via trigger (blocks cannot be updated or deleted).
4. Restrict `certificate_drafts` to ensure teachers can never update another teacher's draft, and only approved teachers can insert.
5. Create `activity_logs` table for administrative audit trails (logins, approvals, revocations, and deletions).
*/

-- ============================================================
-- 1. REVOKE ALL LEGACY PERMISSIVE POLICIES
-- ============================================================

-- Certificates
DROP POLICY IF EXISTS "anon_insert_certificates" ON certificates;
DROP POLICY IF EXISTS "anon_update_certificates" ON certificates;
DROP POLICY IF EXISTS "anon_delete_certificates" ON certificates;
DROP POLICY IF EXISTS "certificates_insert_deny" ON certificates;
DROP POLICY IF EXISTS "certificates_update_deny" ON certificates;
DROP POLICY IF EXISTS "certificates_delete_deny" ON certificates;

-- Blocks (Blockchain Ledger)
DROP POLICY IF EXISTS "anon_insert_blocks" ON blocks;
DROP POLICY IF EXISTS "anon_update_blocks" ON blocks;
DROP POLICY IF EXISTS "anon_delete_blocks" ON blocks;

-- Verification Logs
DROP POLICY IF EXISTS "anon_insert_verification_logs" ON verification_logs;
DROP POLICY IF EXISTS "anon_update_verification_logs" ON verification_logs;
DROP POLICY IF EXISTS "anon_delete_verification_logs" ON verification_logs;

-- Stats
DROP POLICY IF EXISTS "anon_insert_stats" ON stats;
DROP POLICY IF EXISTS "anon_update_stats" ON stats;
DROP POLICY IF EXISTS "anon_delete_stats" ON stats;

-- ============================================================
-- 2. SECURE USERS TABLE & PREVENT PRIVILEGE ESCALATION
-- ============================================================
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_select_admin" ON users;
CREATE POLICY "users_select_admin" ON users FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.status = 'approved')
  );

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_admin" ON users;
CREATE POLICY "users_update_admin" ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.status = 'approved')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.status = 'approved')
  );

DROP POLICY IF EXISTS "users_delete_own_or_admin" ON users;
CREATE POLICY "users_delete_own_or_admin" ON users FOR DELETE
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.status = 'approved')
  );

-- Database trigger: Strictly prevent non-admins from changing role or status
CREATE OR REPLACE FUNCTION prevent_user_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If not an approved admin, block any role or status changes
  IF NOT EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.status = 'approved') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify your own user role.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify your own account approval status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_user_privilege_escalation ON users;
CREATE TRIGGER trg_prevent_user_privilege_escalation
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_user_privilege_escalation();

-- ============================================================
-- 3. SECURE CERTIFICATE_DRAFTS TABLE (TEACHER ISOLATION)
-- ============================================================
ALTER TABLE IF EXISTS certificate_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drafts_select_own" ON certificate_drafts;
CREATE POLICY "drafts_select_own" ON certificate_drafts FOR SELECT
  TO authenticated USING (
    teacher_id = auth.uid()
  );

DROP POLICY IF EXISTS "drafts_select_admin" ON certificate_drafts;
CREATE POLICY "drafts_select_admin" ON certificate_drafts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.status = 'approved')
  );

DROP POLICY IF EXISTS "drafts_select_student" ON certificate_drafts;
CREATE POLICY "drafts_select_student" ON certificate_drafts FOR SELECT
  TO authenticated USING (
    student_email IS NOT NULL AND
    student_email = (SELECT email FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "drafts_insert_teacher" ON certificate_drafts;
CREATE POLICY "drafts_insert_teacher" ON certificate_drafts FOR INSERT
  TO authenticated WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'teacher' AND u.status = 'approved')
  );

-- Teachers can ONLY update their own drafts when in draft or rejected state
DROP POLICY IF EXISTS "drafts_update_teacher" ON certificate_drafts;
CREATE POLICY "drafts_update_teacher" ON certificate_drafts FOR UPDATE
  TO authenticated
  USING (
    teacher_id = auth.uid() AND
    status IN ('draft', 'rejected')
  )
  WITH CHECK (
    teacher_id = auth.uid() AND
    status IN ('draft', 'submitted')
  );

DROP POLICY IF EXISTS "drafts_update_admin" ON certificate_drafts;
CREATE POLICY "drafts_update_admin" ON certificate_drafts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.status = 'approved')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.status = 'approved')
  );

DROP POLICY IF EXISTS "drafts_delete_teacher_or_admin" ON certificate_drafts;
CREATE POLICY "drafts_delete_teacher_or_admin" ON certificate_drafts FOR DELETE
  TO authenticated
  USING (
    (teacher_id = auth.uid() AND status = 'draft') OR
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.status = 'approved')
  );

-- ============================================================
-- 4. SECURE CERTIFICATES TABLE (READ-ONLY FOR CLIENTS)
-- ============================================================
ALTER TABLE IF EXISTS certificates ENABLE ROW LEVEL SECURITY;

-- Select policies: Public can read for verification/ledger; Student reads own; Admin reads all
DROP POLICY IF EXISTS "certificates_select_public" ON certificates;
CREATE POLICY "certificates_select_public" ON certificates FOR SELECT
  TO anon, authenticated USING (true);

-- No INSERT, UPDATE, or DELETE policies exist for anon or authenticated!
-- Only service_role via backend/edge functions can modify certificates.

-- ============================================================
-- 5. SECURE BLOCKS TABLE (IMMUTABLE LEDGER)
-- ============================================================
ALTER TABLE IF EXISTS blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocks_select_all" ON blocks;
CREATE POLICY "blocks_select_all" ON blocks FOR SELECT
  TO anon, authenticated USING (true);

-- Trigger to guarantee mathematically immutable blockchain blocks
CREATE OR REPLACE FUNCTION prevent_block_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Security Exception: Blockchain blocks are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_block_tampering ON blocks;
CREATE TRIGGER trg_prevent_block_tampering
  BEFORE UPDATE OR DELETE ON blocks
  FOR EACH ROW
  EXECUTE FUNCTION prevent_block_tampering();

-- ============================================================
-- 6. SECURE VERIFICATION LOGS TABLE
-- ============================================================
ALTER TABLE IF EXISTS verification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verification_logs_select_all" ON verification_logs;
CREATE POLICY "verification_logs_select_all" ON verification_logs FOR SELECT
  TO anon, authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies for clients (service_role only)

-- ============================================================
-- 7. SECURE STATS TABLE
-- ============================================================
ALTER TABLE IF EXISTS stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stats_select_all" ON stats;
CREATE POLICY "stats_select_all" ON stats FOR SELECT
  TO anon, authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies for clients (service_role only)

-- ============================================================
-- 8. ACTIVITY LOGS AUDIT TABLE (PART 2 REQUIREMENT)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_logs_select_admin" ON activity_logs;
CREATE POLICY "activity_logs_select_admin" ON activity_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.status = 'approved')
  );

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
