# Production Deployment Checklist — ChainCert System

Follow this checklist prior to public launch on Vercel/Netlify (Frontend) and Render/Railway/MongoDB Atlas (Backend & Database).

---

## 1. MongoDB Atlas Setup (Database)

- [ ] **Create MongoDB Atlas Cluster**:
  - Deploy a MongoDB Atlas Cluster (M0 Free Tier or higher).
  - Create database named `chaincert`.
- [ ] **Database Network Access & User**:
  - Add IP Access List entry (allow `0.0.0.0/0` for serverless/PaaS or specify Render IP ranges).
  - Create database user with ReadWrite permissions to `chaincert`.
- [ ] **Connection String**:
  - Copy URI format: `mongodb+srv://<username>:<password>@cluster.mongodb.net/chaincert?retryWrites=true&w=majority`.

---

## 2. Backend Hosting Setup (Render / Railway / Heroku)

- [ ] **Build & Runtime Settings**:
  - **Runtime**: Node.js 20.x or higher
  - **Build Command**: `npm install`
  - **Start Command**: `npm start` (Runs `node server.js`)
- [ ] **Environment Variables**:
  Add in host dashboard:
  - `PORT`: `5000` (or host assigned port)
  - `MONGODB_URI`: `<your-mongodb-atlas-connection-string>`
  - `MONGODB_DATABASE`: `chaincert`
  - `JWT_SECRET`: `<secure-random-secret-key>`
  - `ALLOWED_ORIGIN`: `https://your-frontend-domain.vercel.app`

---

## 3. Frontend Hosting Setup (Vercel / Netlify)

- [ ] **Build Settings**:
  - **Framework Preset**: Vite
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
  - **Node Version**: 20.x or higher

- [ ] **Environment Variables**:
  Add in Vercel / Netlify dashboard:
  - `VITE_API_URL`: `https://your-backend-api.onrender.com`
  - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com`

- [ ] **SPA Route Rewrites**:
  - Handled automatically via `vercel.json` (`/.* -> /index.html`) or `public/_redirects` (`/* /index.html 200`).

---

## 4. Post-Deployment Verification Pass

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
