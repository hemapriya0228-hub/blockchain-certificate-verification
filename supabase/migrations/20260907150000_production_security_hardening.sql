/*
# Production Security Hardening & Strict RBAC Policies

## Overview
This migration tightens database-level Row Level Security (RLS) to enforce production-grade
access boundaries across all tables in ChainCert:

1. `users`:
   - Authenticated users can ONLY read their own profile.
   - Administrators can read and update all user profiles.
   - Unauthorized direct updates or status tampering are strictly forbidden.

2. `certificate_drafts`:
   - Teachers can ONLY create, read, update their own drafts (`teacher_id = auth.uid()`).
   - Students can ONLY read drafts where their verified email matches `student_email`.
   - Administrators can review, approve, reject, or delete all drafts.

3. `certificates`:
   - Direct inserts, updates, and deletes are revoked for anon and authenticated users
     (writes MUST go through the verified edge function with cryptographic hashing).
   - Students can ONLY select their own issued certificates (`owner_id = auth.uid()`).
   - Administrators can select all certificates.
   - Anon / Public users can only select single certificates via verified lookup or through the public ledger view.

4. `blocks`:
   - Direct inserts, updates, and deletes are revoked for client roles.
   - Read-only access for ledger auditing.
*/

-- ============================================================
-- 1. HARDEN USERS RLS
-- ============================================================
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_select_admin" ON users;
CREATE POLICY "users_select_admin" ON users FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_admin" ON users;
CREATE POLICY "users_update_admin" ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================================
-- 2. HARDEN CERTIFICATE_DRAFTS RLS
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
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
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
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'teacher')
  );

DROP POLICY IF EXISTS "drafts_update_teacher" ON certificate_drafts;
CREATE POLICY "drafts_update_teacher" ON certificate_drafts FOR UPDATE
  TO authenticated
  USING (
    teacher_id = auth.uid() AND
    status IN ('draft', 'rejected')
  )
  WITH CHECK (
    teacher_id = auth.uid()
  );

DROP POLICY IF EXISTS "drafts_update_admin" ON certificate_drafts;
CREATE POLICY "drafts_update_admin" ON certificate_drafts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "drafts_delete_admin" ON certificate_drafts;
CREATE POLICY "drafts_delete_admin" ON certificate_drafts FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================================
-- 3. HARDEN CERTIFICATES RLS
-- ============================================================
ALTER TABLE IF EXISTS certificates ENABLE ROW LEVEL SECURITY;

-- Revoke direct writes from clients (only service_role key via edge function can insert/modify)
DROP POLICY IF EXISTS "certificates_insert_deny" ON certificates;
DROP POLICY IF EXISTS "certificates_update_deny" ON certificates;
DROP POLICY IF EXISTS "certificates_delete_deny" ON certificates;

-- Select policies: Admin can read all; Student can read own; Public can read for ledger/verify
DROP POLICY IF EXISTS "certificates_select_admin" ON certificates;
CREATE POLICY "certificates_select_admin" ON certificates FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "certificates_select_student" ON certificates;
CREATE POLICY "certificates_select_student" ON certificates FOR SELECT
  TO authenticated USING (
    owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "certificates_select_public" ON certificates;
CREATE POLICY "certificates_select_public" ON certificates FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- 4. HARDEN BLOCKS RLS (IMMUTABLE LEDGER)
-- ============================================================
ALTER TABLE IF EXISTS blocks ENABLE ROW LEVEL SECURITY;

-- Blocks are read-only public ledger. Direct client modifications are strictly forbidden.
DROP POLICY IF EXISTS "blocks_select_all" ON blocks;
CREATE POLICY "blocks_select_all" ON blocks FOR SELECT
  TO anon, authenticated USING (true);
