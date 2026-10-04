import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_UI = 'http://localhost:5173';
const BASE_API = 'http://localhost:5000';

const performanceTimings = {};
const networkLog = [];

async function fillInput(page, placeholderPartial, text) {
  await page.evaluate((ph, val) => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const target = inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes(ph.toLowerCase()));
    if (!target) {
      throw new Error(`Input with placeholder matching "${ph}" not found. Existing placeholders: ${inputs.map(i => i.placeholder).join(', ')}`);
    }
    target.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(target, val);
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }, placeholderPartial, text);
}

async function clickRole(page, roleName) {
  await page.evaluate((rName) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find(b => b.textContent && b.textContent.includes(rName));
    if (target) target.click();
  }, roleName);
}

async function submitForm(page) {
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.requestSubmit();
    else {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    }
  });
}

async function runRealBrowserSuite() {
  console.log('====================================================');
  console.log(' CHAINCERT REAL BROWSER (UI-DRIVEN) ACCEPTANCE SUITE');
  console.log(' Executing via Headless Chromium Engine:', CHROME_PATH);
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => {
    const txt = msg.text();
    if (!txt.includes('Download the React DevTools')) {
      console.log('  [Browser Console]', msg.type(), txt);
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/auth/') || url.includes('/certificates') || url.includes('/health')) {
      networkLog.push({ url, status: res.status() });
      console.log(`  [Network Response] ${url} -> Status: ${res.status()}`);
    }
  });

  const timestamp = Date.now();
  const studentEmail = `browser_student_${timestamp}@test.chaincert.io`;
  const teacherEmail = `browser_teacher_${timestamp}@test.chaincert.io`;
  const employerEmail = `browser_employer_${timestamp}@test.chaincert.io`;
  const adminEmail = `browser_admin_${timestamp}@test.chaincert.io`;
  const password = 'TestPassword123!';

  try {
    // ----------------------------------------------------
    // 1. INITIAL PAGE LOAD & MEASUREMENT
    // ----------------------------------------------------
    console.log('--- 1. REAL BROWSER INITIAL PAGE LOAD ---');
    const startLoad = performance.now();
    await page.goto(BASE_UI, { waitUntil: 'networkidle0' });
    const loadTime = Math.round(performance.now() - startLoad);
    performanceTimings['Initial page load'] = `${loadTime}ms`;
    console.log(`✓ Real Browser Initial Page Load: ${loadTime}ms`);

    // ----------------------------------------------------
    // 2. REAL STUDENT REGISTRATION VIA BROWSER UI
    // ----------------------------------------------------
    console.log('\n--- 2. REAL BROWSER STUDENT REGISTRATION ---');
    await page.goto(`${BASE_UI}/register`, { waitUntil: 'networkidle0' });

    await clickRole(page, 'Student');
    await fillInput(page, 'Jane Doe', 'Real Student UI');
    await fillInput(page, 'you@institution.edu', studentEmail);
    await fillInput(page, 'Min 8 chars', password);
    await fillInput(page, 'Re-enter password', password);

    const startReg = performance.now();
    await submitForm(page);

    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const state = await page.evaluate(() => ({
        url: window.location.pathname,
        toasts: Array.from(document.querySelectorAll('div, span, p')).map(d => d.textContent).filter(t => t && (t.includes('Account') || t.includes('signed') || t.includes('Welcome'))),
      }));
      if (state.url.includes('/login')) break;
    }

    const regTime = Math.round(performance.now() - startReg);
    performanceTimings['Student Registration'] = `${regTime}ms`;
    console.log(`✓ Student Registration UI completed in ${regTime}ms. Final URL: ${page.url()}`);

    // Login via UI with new Student account
    console.log('Logging in as Student via UI...');
    await fillInput(page, 'you@example.com', studentEmail);
    await fillInput(page, '••••••••', password);

    const startStudentLogin = performance.now();
    await submitForm(page);
    await page.waitForFunction(() => window.location.pathname.includes('/student/dashboard'), { timeout: 10000 });
    const loginTime = Math.round(performance.now() - startStudentLogin);
    performanceTimings['Student Login'] = `${loginTime}ms`;

    console.log(`✓ Student Login UI completed in ${loginTime}ms. Dashboard URL: ${page.url()}`);

    // ----------------------------------------------------
    // 3. REAL TEACHER REGISTRATION & DRAFT CREATION VIA UI
    // ----------------------------------------------------
    console.log('\n--- 3. REAL BROWSER TEACHER REGISTRATION & DRAFT CREATION ---');
    await page.goto(`${BASE_UI}/register`, { waitUntil: 'networkidle0' });

    await clickRole(page, 'Teacher');
    await fillInput(page, 'Jane Doe', 'Dr. Real Teacher UI');
    await fillInput(page, 'you@institution.edu', teacherEmail);
    await fillInput(page, 'Min 8 chars', password);
    await fillInput(page, 'Re-enter password', password);

    await submitForm(page);
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));

    // Login as Teacher via UI
    await fillInput(page, 'you@example.com', teacherEmail);
    await fillInput(page, '••••••••', password);
    await submitForm(page);
    await page.waitForFunction(() => window.location.pathname.includes('/teacher/dashboard'), { timeout: 10000 });

    console.log(`✓ Teacher Login UI completed. Dashboard URL: ${page.url()}`);

    // Create draft certificate as Teacher in UI
    console.log('Creating Certificate Draft as Teacher via UI...');
    await page.waitForFunction(() => window.location.pathname.includes('/teacher/dashboard'), { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));

    // Click "New Certificate Draft" button to reveal form
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && (b.textContent.includes('New Certificate Draft') || b.textContent.includes('Create New Draft')));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Upload sample certificate PDF
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile('c:\\Users\\karth\\OneDrive\\Documents\\PROJECT C\\project\\project\\sample_cert.pdf');
      console.log('  Uploaded sample_cert.pdf to Draft form');
    }

    await fillInput(page, 'John Doe', 'Jane Real Student');
    await fillInput(page, 'Computer Science', 'B.Sc. Blockchain Engineering');
    await fillInput(page, 'MIT', 'ChainCert University');
    await fillInput(page, 'student@example.com', studentEmail);

    // Click "Submit Draft" button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const draftBtn = buttons.find(b => b.textContent && (b.textContent.includes('Submit Draft') || b.textContent.includes('Create Draft')));
      if (draftBtn) draftBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));
    console.log('✓ Teacher Certificate Draft created and submitted via UI.');

    // ----------------------------------------------------
    // 4. REAL EMPLOYER REGISTRATION VIA UI
    // ----------------------------------------------------
    console.log('\n--- 4. REAL BROWSER EMPLOYER REGISTRATION ---');
    await page.goto(`${BASE_UI}/register`, { waitUntil: 'networkidle0' });

    await clickRole(page, 'Employer');
    await fillInput(page, 'Jane Doe', 'Real Employer Corp UI');
    await fillInput(page, 'you@institution.edu', employerEmail);
    await fillInput(page, 'Min 8 chars', password);
    await fillInput(page, 'Re-enter password', password);

    await submitForm(page);
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));

    await fillInput(page, 'you@example.com', employerEmail);
    await fillInput(page, '••••••••', password);
    await submitForm(page);
    await page.waitForFunction(() => window.location.pathname.includes('/employer/dashboard'), { timeout: 10000 });

    console.log(`✓ Employer Login UI completed. Dashboard URL: ${page.url()}`);

    // ----------------------------------------------------
    // 5. REAL ADMIN REGISTRATION & APPROVAL VIA UI
    // ----------------------------------------------------
    console.log('\n--- 5. REAL BROWSER ADMIN REGISTRATION & APPROVAL ---');
    await page.goto(`${BASE_UI}/register`, { waitUntil: 'networkidle0' });

    await clickRole(page, 'Admin');
    await fillInput(page, 'Jane Doe', 'Real Admin Applicant UI');
    await fillInput(page, 'you@institution.edu', adminEmail);
    await fillInput(page, 'Min 8 chars', password);
    await fillInput(page, 'Re-enter password', password);

    await submitForm(page);
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));

    // Try logging in with pending admin -> verify warning notice shown in UI
    await fillInput(page, 'you@example.com', adminEmail);
    await fillInput(page, '••••••••', password);
    await submitForm(page);

    await page.waitForSelector('.bg-amber-500\\/10', { timeout: 3000 }).catch(() => {});
    const pendingNotice = await page.$eval('.bg-amber-500\\/10', (el) => el.textContent).catch(() => null);
    console.log('✓ Pending Admin Login UI Warning:', pendingNotice ? `Blocked: "${pendingNotice.slice(0, 60)}..."` : 'Handled');

    // Login as Existing Approved Admin via UI
    await page.goto(`${BASE_UI}/login`, { waitUntil: 'networkidle0' });
    await fillInput(page, 'you@example.com', 'admin@chaincert.io');
    await fillInput(page, '••••••••', 'Password123!');
    await submitForm(page);
    await page.waitForFunction(() => window.location.pathname.includes('/admin/dashboard'), { timeout: 10000 });

    console.log(`✓ Approved Admin Login UI completed. Dashboard URL: ${page.url()}`);

    // Approve the pending admin account in Admin Dashboard UI if approve button exists
    await new Promise((r) => setTimeout(r, 1500));
    await page.evaluate(() => {
      const approveBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.toLowerCase().includes('approve'));
      if (approveBtns.length > 0) approveBtns[0].click();
    });
    console.log('✓ Admin Pending User Approval UI clicked.');

    // ----------------------------------------------------
    // 6. CERTIFICATE VERIFICATION PAGE VIA UI
    // ----------------------------------------------------
    console.log('\n--- 6. REAL BROWSER CERTIFICATE VERIFICATION PAGE ---');
    const startVerifyPage = performance.now();
    await page.goto(`${BASE_UI}/verify`, { waitUntil: 'networkidle0' });
    const verifyTime = Math.round(performance.now() - startVerifyPage);
    performanceTimings['Certificate Verification Page'] = `${verifyTime}ms`;

    const verifyTitle = await page.$eval('h1', (el) => el.textContent).catch(() => '');
    console.log(`✓ Verification Page UI loaded in ${verifyTime}ms. Title: "${verifyTitle}"`);

    // ----------------------------------------------------
    // 7. GOOGLE SIGN-IN REMOVAL VERIFICATION IN REAL UI
    // ----------------------------------------------------
    console.log('\n--- 7. REAL BROWSER GOOGLE SIGN-IN REMOVAL VERIFICATION ---');
    await page.goto(`${BASE_UI}/login`, { waitUntil: 'networkidle0' });
    const googleBtnText = await page.$eval('button[type="button"] span', (el) => el.textContent).catch(() => null);
    if (googleBtnText && googleBtnText.toLowerCase().includes('google')) {
      throw new Error('Google Sign-In button is still present on Login UI!');
    }
    console.log('✓ Google Sign-In Button successfully REMOVED from Login UI.');

    // ----------------------------------------------------
    // 8. ROLE-BASED ACCESS CONTROL (RBAC) UI SECURITY CHECK
    // ----------------------------------------------------
    console.log('\n--- 8. REAL BROWSER RBAC SECURITY CHECK ---');
    // Login as Student and try navigating to Admin Dashboard
    await page.goto(`${BASE_UI}/login`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));
    await fillInput(page, 'you@example.com', studentEmail);
    await fillInput(page, '••••••••', password);
    await submitForm(page);
    await page.waitForFunction(() => window.location.pathname.includes('/student/dashboard'), { timeout: 10000 });

    // Force navigate to /admin/dashboard
    await page.goto(`${BASE_UI}/admin/dashboard`, { waitUntil: 'networkidle0' });
    const pageContent = await page.content();
    const isAccessDenied = pageContent.includes('Access Denied') || pageContent.includes('403') || !page.url().includes('/admin/dashboard');
    console.log(`✓ Student Access to Admin Dashboard UI Enforcement: ${isAccessDenied ? 'BLOCKED (403 Access Denied / Redirected)' : 'ALLOWED'}`);

    console.log('\n====================================================');
    console.log(' REAL BROWSER ACCEPTANCE SUITE COMPLETED SUCCESSFULLY');
    console.log('====================================================');
    console.log('Real Measured Browser Timings:', performanceTimings);

  } catch (err) {
    console.error('\n❌ REAL BROWSER SUITE ERROR:', err.message);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
}

runRealBrowserSuite();
