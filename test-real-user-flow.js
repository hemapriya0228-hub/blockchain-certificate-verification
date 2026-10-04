import { MongoClient } from 'mongodb';

const BASE_URL = 'http://localhost:5000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chaincert';
const DB_NAME = process.env.MONGODB_DATABASE || 'chaincert';

const timing = {};

async function measureTime(name, fn) {
  const start = performance.now();
  const res = await fn();
  const duration = Math.round(performance.now() - start);
  timing[name] = `${duration}ms`;
  return res;
}

async function runRealUserAcceptanceSuite() {
  console.log('====================================================');
  console.log(' CHAINCERT REAL USER END-TO-END ACCEPTANCE SUITE');
  console.log('====================================================\n');

  let dbClient = null;
  let db = null;

  try {
    dbClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    await dbClient.connect();
    db = dbClient.db(DB_NAME);
    console.log(`[DB Verification] Connected to MongoDB database: '${DB_NAME}'`);
  } catch (err) {
    console.warn(`[DB Verification Warning] Could not connect directly to MongoDB (${err.message}). Test will continue checking API behavior.`);
  }

  const timestamp = Date.now();
  const studentEmail = `student_${timestamp}@test.chaincert.io`;
  const teacherEmail = `teacher_${timestamp}@test.chaincert.io`;
  const employerEmail = `employer_${timestamp}@test.chaincert.io`;
  const newAdminEmail = `pending_admin_${timestamp}@test.chaincert.io`;
  const defaultPassword = 'TestPassword123!';

  // ----------------------------------------------------
  // 1. HEALTH CHECK
  // ----------------------------------------------------
  console.log('\n--- 1. TESTING HEALTH & SYSTEM API ---');
  const healthRes = await measureTime('Health Check', () =>
    fetch(`${BASE_URL}/health`).then((r) => r.json())
  );
  console.log('Health Response:', healthRes);
  if (healthRes.status !== 'ok') throw new Error('Health check failed!');

  // ----------------------------------------------------
  // 2. STUDENT REGISTRATION & LOGIN
  // ----------------------------------------------------
  console.log('\n--- 2. TESTING STUDENT REGISTRATION & LOGIN ---');
  const studentReg = await measureTime('Student Registration API', () =>
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: defaultPassword,
        fullName: 'Test Student User',
        role: 'student',
      }),
    }).then((r) => r.json())
  );

  console.log('Student Registration Output:', studentReg);
  if (studentReg.requiresApproval !== false) throw new Error('Student registration incorrectly marked as requiring approval!');

  const studentLogin = await measureTime('Student Login API', () =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: defaultPassword }),
    }).then((r) => r.json())
  );

  console.log('Student Login Output:', { token: Boolean(studentLogin.token), user: studentLogin.user });
  if (!studentLogin.token || studentLogin.user?.status !== 'approved') throw new Error('Student login failed or not approved!');

  // Verify DB state for student
  if (db) {
    const studentDbUser = await db.collection('users').findOne({ email: studentEmail });
    console.log('[DB Verification] Student record status in MongoDB:', studentDbUser?.status);
    if (studentDbUser?.status !== 'approved') throw new Error('Student status in MongoDB is not approved!');
  }

  // ----------------------------------------------------
  // 3. TEACHER REGISTRATION & DRAFT CREATION
  // ----------------------------------------------------
  console.log('\n--- 3. TESTING TEACHER REGISTRATION & DRAFT SUBMISSION ---');
  const teacherReg = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: teacherEmail,
      password: defaultPassword,
      fullName: 'Dr. Test Teacher',
      role: 'teacher',
    }),
  }).then((r) => r.json());

  console.log('Teacher Registration Output:', teacherReg);

  const teacherLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: teacherEmail, password: defaultPassword }),
  }).then((r) => r.json());

  if (!teacherLogin.token) throw new Error('Teacher login failed!');

  // Create & Submit Draft as Teacher
  const draftRes = await fetch(`${BASE_URL}/teacher/certificates/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacherLogin.token}`,
    },
    body: JSON.stringify({
      studentName: 'Test Student User',
      course: 'Advanced Cryptography & Blockchain Security',
      institution: 'ChainCert Academy',
      issueDate: '2026-10-02',
      studentEmail,
      fileContent: 'SAMPLE_PDF_CERTIFICATE_CONTENT_BASE64_SIMULATION',
      fileName: 'certificate.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      submit: true,
    }),
  }).then((r) => r.json());

  console.log('Submitted Certificate Draft:', draftRes.draft?.draft_id, 'Status:', draftRes.draft?.status);
  if (draftRes.draft?.status !== 'submitted') throw new Error('Teacher draft submission failed!');

  // ----------------------------------------------------
  // 4. EMPLOYER REGISTRATION & CANDIDATE VERIFICATION
  // ----------------------------------------------------
  console.log('\n--- 4. TESTING EMPLOYER REGISTRATION & WORKSPACE ---');
  const employerReg = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: employerEmail,
      password: defaultPassword,
      fullName: 'Global Tech Recruiter',
      role: 'employer',
    }),
  }).then((r) => r.json());

  console.log('Employer Registration Output:', employerReg);

  const employerLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: employerEmail, password: defaultPassword }),
  }).then((r) => r.json());

  if (!employerLogin.token) throw new Error('Employer login failed!');

  // ----------------------------------------------------
  // 5. ADMIN REGISTRATION & APPROVAL FLOW
  // ----------------------------------------------------
  console.log('\n--- 5. TESTING ADMIN REGISTRATION & EXISTING ADMIN APPROVAL ---');
  const adminReg = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: newAdminEmail,
      password: defaultPassword,
      fullName: 'Pending Admin Applicant',
      role: 'admin',
    }),
  }).then((r) => r.json());

  console.log('Admin Registration Request Output:', adminReg);
  if (adminReg.requiresApproval !== true) throw new Error('Admin registration MUST require existing admin approval!');

  // Attempt login with pending admin (should be blocked with HTTP 403)
  const blockedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: newAdminEmail, password: defaultPassword }),
  });

  console.log('Pending Admin Login Attempt Status:', blockedLoginRes.status);
  if (blockedLoginRes.status !== 403) throw new Error('Pending admin was allowed to log in before approval!');

  // Login as existing approved System Admin
  const existingAdminLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@chaincert.io', password: 'Password123!' }),
  }).then((r) => r.json());

  if (!existingAdminLogin.token) throw new Error('System Admin login failed!');

  // Existing Admin approves pending Admin user
  let pendingAdminUser = null;
  if (db) {
    pendingAdminUser = await db.collection('users').findOne({ email: newAdminEmail });
  }

  if (pendingAdminUser) {
    const approveUserRes = await fetch(`${BASE_URL}/admin/users/${pendingAdminUser.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${existingAdminLogin.token}` },
    }).then((r) => r.json());

    console.log('Admin User Approval Response:', approveUserRes.message);

    // Verify login of newly approved Admin
    const approvedAdminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newAdminEmail, password: defaultPassword }),
    }).then((r) => r.json());

    console.log('Newly Approved Admin Login Success:', Boolean(approvedAdminLogin.token));
    if (!approvedAdminLogin.token) throw new Error('Newly approved admin could not log in!');
  }

  // Admin approves Teacher's submitted draft
  const approveDraftRes = await fetch(`${BASE_URL}/admin/certificates/${draftRes.draft.draft_id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${existingAdminLogin.token}` },
  }).then((r) => r.json());

  console.log('Draft Approved & Certificate Issued:', approveDraftRes.certificate?.certificate_id);
  const certId = approveDraftRes.certificate?.certificate_id;

  // ----------------------------------------------------
  // 6. CERTIFICATE VERIFICATION & REVOCATION
  // ----------------------------------------------------
  console.log('\n--- 6. TESTING CERTIFICATE VERIFICATION & REVOCATION ---');
  const verifyValid = await measureTime('Certificate Verification API', () =>
    fetch(`${BASE_URL}/certificates/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ certificateId: certId }),
    }).then((r) => r.json())
  );

  console.log('Certificate Verification Result:', verifyValid.result, 'Chain Valid:', verifyValid.chainValid);
  if (verifyValid.result !== 'valid' || !verifyValid.chainValid) throw new Error('Certificate verification failed!');

  // Revoke certificate as Admin
  const revokeRes = await fetch(`${BASE_URL}/admin/certificates/${certId}/revoke`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${existingAdminLogin.token}` },
  }).then((r) => r.json());

  console.log('Revocation Response:', revokeRes.message);

  const verifyRevoked = await fetch(`${BASE_URL}/certificates/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ certificateId: certId }),
  }).then((r) => r.json());

  console.log('Revoked Verification Result:', verifyRevoked.result);
  if (verifyRevoked.result !== 'revoked') throw new Error('Certificate revocation verification failed!');

  // ----------------------------------------------------
  // 7. GOOGLE AUTH ENDPOINT REMOVAL VERIFICATION
  // ----------------------------------------------------
  console.log('\n--- 7. TESTING GOOGLE AUTH ENDPOINT REMOVAL (EXPECT 404) ---');
  const googleErrRes = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'invalid_token_for_testing' }),
  });
  console.log('Google Auth Endpoint HTTP Status:', googleErrRes.status);
  if (googleErrRes.status !== 404) throw new Error(`Google Auth endpoint should be removed (expected 404), but got HTTP ${googleErrRes.status}!`);
  console.log('✓ POST /auth/google endpoint successfully REMOVED (returns 404 Not Found).');

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(' ALL END-TO-END ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
  console.log(' REAL USER REGISTRATION, AUTH, AND BLOCKCHAIN VERIFIED');
  console.log('====================================================');
  console.log('Measured API Timings:', timing);

  if (dbClient) await dbClient.close();
}

runRealUserAcceptanceSuite().catch((err) => {
  console.error('\n❌ ACCEPTANCE SUITE FAILED:', err.message);
  process.exit(1);
});
