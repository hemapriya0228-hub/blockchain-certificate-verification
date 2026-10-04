import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_UI = 'http://localhost:5173';
const BASE_API = 'http://localhost:5000';

async function fillInput(page, placeholderPartial, text) {
  await page.evaluate((ph, val) => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const target = inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes(ph.toLowerCase()));
    if (!target) {
      throw new Error(`Input with placeholder matching "${ph}" not found. Available: ${inputs.map(i => i.placeholder).join(', ')}`);
    }
    target.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(target, val);
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }, placeholderPartial, text);
}

async function runInstitutionTest() {
  console.log('====================================================');
  console.log(' CHAINCERT INSTITUTION REGISTRATION REAL BROWSER TEST');
  console.log('====================================================\n');

  // 1. HEALTHCHECK ENDPOINT TEST
  console.log('--- 1. TESTING /health ENDPOINT ---');
  const healthRes = await fetch(`${BASE_API}/health`);
  console.log('Health Endpoint Status:', healthRes.status);
  const healthBody = await healthRes.json();
  console.log('Health Payload:', healthBody);
  if (healthRes.status !== 200 || healthBody.status !== 'ok') {
    throw new Error(`/health endpoint returned invalid response! Status: ${healthRes.status}`);
  }
  console.log('✓ /health endpoint returned HTTP 200 OK.');

  // 2. REAL BROWSER INSTITUTION REGISTRATION
  console.log('\n--- 2. REAL BROWSER INSTITUTION REGISTRATION FORM TEST ---');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    let apiReqDetails = null;
    let apiResDetails = null;

    page.on('request', (req) => {
      if (req.url().includes('5000/institution/register')) {
        apiReqDetails = {
          url: req.url(),
          method: req.method(),
          headers: req.headers(),
          postData: req.postData(),
        };
      }
    });

    page.on('response', async (res) => {
      if (res.url().includes('5000/institution/register')) {
        let text = '';
        try { text = await res.text(); } catch {}
        apiResDetails = {
          url: res.url(),
          status: res.status(),
          ok: res.ok(),
          body: text,
        };
      }
    });

    const instEmail = `stanford_${Date.now()}@stanford.edu`;
    const instPass = 'SecurePass123!';

    console.log(`Navigating to ${BASE_UI}/institution/register ...`);
    await page.goto(`${BASE_UI}/institution/register`, { waitUntil: 'networkidle0' });

    // Fill inputs via synthetic React events
    await fillInput(page, 'Stanford', 'Stanford Test Institute');
    await fillInput(page, 'you@institution.edu', instEmail);
    await fillInput(page, 'Cambridge', 'Palo Alto, CA');

    // Fill textarea
    await page.evaluate(() => {
      const ta = document.querySelector('textarea');
      if (ta) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, 'Premier research university testing ChainCert onboarding.');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Fill passwords (both password inputs)
    await page.evaluate((pass) => {
      const passInputs = Array.from(document.querySelectorAll('input[type="password"]'));
      passInputs.forEach(input => {
        input.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, pass);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }, instPass);

    console.log('Submitting Institution Registration form UI...');
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    });

    // Wait for API response or timeout
    await new Promise(r => setTimeout(r, 2000));

    console.log('\n--- NETWORK REQUEST INSPECTION ---');
    console.log('Request URL:', apiReqDetails?.url);
    console.log('HTTP Method:', apiReqDetails?.method);
    console.log('Request Payload:', apiReqDetails?.postData);
    console.log('Status Code:', apiResDetails?.status);
    console.log('Response Payload:', apiResDetails?.body);

    if (!apiResDetails || apiResDetails.status !== 201) {
      throw new Error(`Institution Registration API failed! Expected HTTP 201, got HTTP ${apiResDetails?.status || 'No Response'}. Body: ${apiResDetails?.body}`);
    }
    console.log('✓ Institution Registration API returned HTTP 201 Created.');

    // 3. INSTITUTION LOGIN VERIFICATION
    console.log('\n--- 3. VERIFYING LOGIN FOR NEWLY REGISTERED INSTITUTION ---');
    await page.goto(`${BASE_UI}/login`, { waitUntil: 'networkidle0' });

    await fillInput(page, 'you@example.com', instEmail);
    await fillInput(page, '••••••••', instPass);

    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    });

    await new Promise(r => setTimeout(r, 2000));

    const dashboardUrl = page.url();
    console.log('Institution Login Dashboard URL:', dashboardUrl);
    if (!dashboardUrl.includes('/institution/dashboard') && !dashboardUrl.includes('/teacher/dashboard')) {
      throw new Error(`Institution Login failed to navigate to institution dashboard! Current URL: ${dashboardUrl}`);
    }
    console.log('✓ Institution Login UI completed successfully! Redirected to Institution Dashboard.');

    console.log('\n====================================================');
    console.log(' INSTITUTION REGISTRATION TEST PASSED 100% SUCCESS');
    console.log('====================================================');
  } finally {
    await browser.close();
  }
}

runInstitutionTest().catch((err) => {
  console.error('\n❌ INSTITUTION TEST FAILED:', err.message);
  process.exit(1);
});
