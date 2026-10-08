import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'assets/screenshots');

async function runSection1() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log(`[Section 1] 1. Visiting Landing Page at ${BASE_URL}...`);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-landing-page.png'), fullPage: true });
  console.log('✅ Captured: assets/screenshots/01-landing-page.png');

  console.log(`[Section 1] 2. Visiting Login Page at ${BASE_URL}/login...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-page.png') });
  console.log('✅ Captured: assets/screenshots/02-login-page.png');

  console.log(`[Section 1] 3. Visiting Signup Page at ${BASE_URL}/signup...`);
  await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02b-signup-page.png') });
  console.log('✅ Captured: assets/screenshots/02b-signup-page.png');

  console.log(`[Section 1] 4. Performing Login as maazalisshahid@gmail.com...`);
  const loginRes = await context.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: 'maazalisshahid@gmail.com',
      password: 'pas#123#',
    },
  });
  console.log('Login API status:', loginRes.status());
  const loginData = await loginRes.json();
  console.log('Logged in user:', loginData.user);

  console.log(`[Section 1] 5. Navigating to Dashboard...`);
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-dashboard-initial.png') });
  console.log('✅ Captured: assets/screenshots/03-dashboard-initial.png');

  await browser.close();
  console.log('🎉 Section 1 Testing Complete!');
}

runSection1().catch((err) => {
  console.error('Section 1 failed:', err);
  process.exit(1);
});
