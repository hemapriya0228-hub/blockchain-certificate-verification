# Production Deployment Checklist — ChainCert System

Follow this checklist prior to public launch on Vercel/Netlify (frontend) and Supabase (backend/database).

---

## 1. Supabase Project Setup (Backend / Database)

- [ ] **Run Database Migrations**:
  Execute migrations in `supabase/migrations/` in order:
  1. `20260907124227_create_certificate_verification_system.sql`
  2. `20260907130255_add_rbac_users_and_drafts.sql`
  3. `20260907150000_production_security_hardening.sql` (Strict RLS enforcement)

- [ ] **Deploy Edge Function (`cert-api`)**:
  ```bash
  supabase functions deploy cert-api --project-ref <your-project-id>
  ```

- [ ] **Configure Edge Function Secrets**:
  Ensure the following environment secrets are set in Supabase Dashboard -> Edge Functions -> Secrets:
  - `SUPABASE_URL`: `https://<your-project-id>.supabase.co`
  - `SUPABASE_ANON_KEY`: `<your-anon-key>`
  - `SUPABASE_SERVICE_ROLE_KEY`: `<your-service-role-key>` (Used securely server-side only)
  - `ALLOWED_ORIGIN`: `https://your-production-domain.com`

- [ ] **Verify Authentication Configuration**:
  - In Supabase Dashboard -> Authentication -> URL Configuration:
    - Set **Site URL** to `https://your-production-domain.com`.
    - Add Redirect URLs: `https://your-production-domain.com/**`.
  - Rate limiting: Under Auth Settings, ensure default brute force rate limits are enabled.

- [ ] **Seed / Confirm Production Admin**:
  Ensure the designated admin account is active in `users` and `auth.users` with `status: 'approved'`.

---

## 2. Frontend Hosting Setup (Vercel / Netlify)

- [ ] **Build Settings**:
  - **Framework Preset**: Vite
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
  - **Node Version**: 20.x or higher

- [ ] **Environment Variables**:
  Add the following in Vercel / Netlify dashboard:
  - `VITE_SUPABASE_URL`: `https://<your-project-id>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY`: `<your-public-anon-key>`

- [ ] **SPA Route Rewrites**:
  - For **Vercel**: Handled automatically via `vercel.json` (`/.* -> /index.html`).
  - For **Netlify**: Handled automatically via `public/_redirects` (`/* /index.html 200`).

- [ ] **Custom Domain & SSL**:
  - Connect custom domain.
  - Verify HTTPS certificate is active (automatic on Vercel/Netlify).

---

## 3. Post-Deployment Verification Pass

- [ ] **Public Verification**: Visit `/verify` and test verifying a certificate hash and downloading QR code.
- [ ] **Public Ledger**: Visit `/ledger` and verify blocks load with cryptographic hashes.
- [ ] **Authentication**:
  - Test registration with role selection (Student/Teacher).
  - Verify pending accounts cannot log in before Admin approval.
  - Test login with Admin account and verify auto-redirection to `/admin/dashboard`.
- [ ] **Access Boundaries**:
  - Visit `/admin/dashboard` as a Student or Teacher -> confirm custom **Access Denied (403)** page displays.
  - Visit an unknown route `/non-existent-page` -> confirm custom **404 Not Found** page displays.
- [ ] **Audit Logs & Tampering**:
  - Issue a test certificate.
  - Verify integrity checks on the blockchain ledger.
