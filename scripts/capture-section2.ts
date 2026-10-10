import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'assets/screenshots');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || process.env.ADMIN_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || process.env.ADMIN_PASSWORD || '';

async function runSection2() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log(`[Section 2] 1. Logging in as super admin...`);
  const loginRes = await context.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });
  console.log('Login API status:', loginRes.status());

  console.log(`[Section 2] 2. Visiting Main Dashboard at ${BASE_URL}/dashboard...`);
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-main-dashboard.png') });
  console.log('✅ Captured: assets/screenshots/04-main-dashboard.png');

  console.log(`[Section 2] 3. Visiting Analytics Overview at ${BASE_URL}/analytics...`);
  await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-analytics-overview.png') });
  console.log('✅ Captured: assets/screenshots/05-analytics-overview.png');

  console.log(`[Section 2] 4. Visiting Revenue Analytics at ${BASE_URL}/analytics/revenue...`);
  await page.goto(`${BASE_URL}/analytics/revenue`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-analytics-revenue.png') });
  console.log('✅ Captured: assets/screenshots/06-analytics-revenue.png');

  console.log(`[Section 2] 5. Visiting Plan Usage Analytics at ${BASE_URL}/analytics/plan-usage...`);
  await page.goto(`${BASE_URL}/analytics/plan-usage`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-analytics-plan-usage.png') });
  console.log('✅ Captured: assets/screenshots/07-analytics-plan-usage.png');

  console.log(`[Section 2] 6. Visiting Reports at ${BASE_URL}/reports and opening Weekly Report modal...`);
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click "Generate Weekly Report" button
  const reportBtn = page.getByRole('button', { name: /Generate Weekly Report/i }).first();
  if (await reportBtn.isVisible()) {
    await reportBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-weekly-report-modal.png') });
  console.log('✅ Captured: assets/screenshots/08-weekly-report-modal.png');

  await browser.close();
  console.log('🎉 Section 2 Testing Complete!');
}

runSection2().catch((err) => {
  console.error('Section 2 failed:', err);
  process.exit(1);
});
