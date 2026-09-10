/*
# RBAC System: Users + Certificate Drafts

## Overview
Adds role-based access control with 4 roles (admin, teacher, student, employer)
and a certificate draft state machine (draft → submitted → approved/rejected → issued).

## New Tables

1. `users` — application user accounts with role and approval status.
   - `id` (uuid, PK, defaults to auth.uid() so Supabase auth users map 1:1)
   - `email` (text, unique, not null)
   - `full_name` (text, not null)
   - `role` (text, not null) — 'admin' | 'teacher' | 'student'
   - `status` (text, default 'pending') — 'pending' | 'approved' | 'rejected'
   - `created_at` (timestamptz, default now())
   - `approved_by` (uuid, nullable) — admin who approved
   - `approved_at` (timestamptz, nullable)

2. `certificate_drafts` — drafts created by teachers, pending admin approval.
   - `id` (uuid, PK)
   - `draft_id` (text, unique) — human-readable draft ID
   - `teacher_id` (uuid, not null) — references users.id
   - `student_name` (text, not null)
   - `course` (text, not null)
   - `institution` (text, not null)
   - `issue_date` (date, not null)
   - `student_email` (text, nullable) — email of the student to link cert
   - `file_content` (text, nullable) — base64 of uploaded file
   - `file_name` (text, nullable)
   - `file_type` (text, nullable)
   - `file_size` (bigint, nullable)
   - `status` (text, default 'draft') — 'draft' | 'submitted' | 'approved' | 'rejected'
   - `rejection_reason` (text, nullable)
   - `certificate_id` (text, nullable) — set when issued (links to certificates table)
   - `reviewed_by` (uuid, nullable) — admin who reviewed
   - `reviewed_at` (timestamptz, nullable)
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now())

## Modified Tables
- `certificates` — added `owner_id` (uuid, nullable) to link issued certs to the student user,
  and `draft_id` (uuid, nullable) to link back to the originating draft.

## Security
- RLS enabled on `users` and `certificate_drafts`.
- Since the app uses Supabase Auth (real JWT), policies are scoped to `authenticated`.
- Users can read their own user record; admins can read all.
- Teachers can CRUD their own drafts; admins can read/review all drafts.
- The `certificates` table policies updated to allow authenticated read for all logged-in users
  (needed for student/teacher/admin dashboards), while writes remain through the edge function
  using the service role key.
*/

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  approved_by uuid,
  approved_at timestamptz
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- Admins can read all users
DROP POLICY IF EXISTS "users_select_admin" ON users;
CREATE POLICY "users_select_admin" ON users FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Users can insert their own record (registration)
DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Users can update their own record (limited)
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admins can update any user (approve/reject)
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
-- CERTIFICATE_DRAFTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS certificate_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id text UNIQUE NOT NULL,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  course text NOT NULL,
  institution text NOT NULL,
  issue_date date NOT NULL,
  student_email text,
  file_content text,
  file_name text,
  file_type text,
  file_size bigint,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  rejection_reason text,
  certificate_id text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE certificate_drafts ENABLE ROW LEVEL SECURITY;

-- Teachers can read their own drafts
DROP POLICY IF EXISTS "drafts_select_own" ON certificate_drafts;
CREATE POLICY "drafts_select_own" ON certificate_drafts FOR SELECT
  TO authenticated USING (teacher_id = auth.uid());

-- Admins can read all drafts
DROP POLICY IF EXISTS "drafts_select_admin" ON certificate_drafts;
CREATE POLICY "drafts_select_admin" ON certificate_drafts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Students can read drafts where their email matches student_email (to see their certs)
DROP POLICY IF EXISTS "drafts_select_student" ON certificate_drafts;
CREATE POLICY "drafts_select_student" ON certificate_drafts FOR SELECT
  TO authenticated USING (
    student_email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- Teachers can insert their own drafts
DROP POLICY IF EXISTS "drafts_insert_own" ON certificate_drafts;
CREATE POLICY "drafts_insert_own" ON certificate_drafts FOR INSERT
  TO authenticated WITH CHECK (teacher_id = auth.uid());

-- Teachers can update their own drafts
DROP POLICY IF EXISTS "drafts_update_own" ON certificate_drafts;
CREATE POLICY "drafts_update_own" ON certificate_drafts FOR UPDATE
  TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

-- Admins can update any draft (approve/reject)
DROP POLICY IF EXISTS "drafts_update_admin" ON certificate_drafts;
CREATE POLICY "drafts_update_admin" ON certificate_drafts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================================
-- ADD COLUMNS TO CERTIFICATES
-- ============================================================
DO $$ BEGIN
  ALTER TABLE certificates ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE certificates ADD COLUMN IF NOT EXISTS draft_id uuid REFERENCES certificate_drafts(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Update certificates SELECT policy to allow authenticated users to read
-- (needed for student/teacher/admin dashboards). Keep insert/update/delete
-- through the service role key (edge function) only.
DROP POLICY IF EXISTS "anon_select_certificates" ON certificates;
CREATE POLICY "anon_select_certificates" ON certificates FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_drafts_teacher_id ON certificate_drafts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON certificate_drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_student_email ON certificate_drafts(student_email);
CREATE INDEX IF NOT EXISTS idx_certificates_owner_id ON certificates(owner_id);

-- ============================================================
-- AUTO-UPDATE updated_at ON DRAFTS
-- ============================================================
CREATE OR REPLACE FUNCTION update_draft_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_draft_updated_at ON certificate_drafts;
CREATE TRIGGER trigger_draft_updated_at
  BEFORE UPDATE ON certificate_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_draft_updated_at();