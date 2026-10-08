import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'assets/screenshots');

async function runSection6() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log(`[Section 6] 1. Authenticating as super admin...`);
  const loginRes = await context.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: 'maazalisshahid@gmail.com',
      password: 'pas#123#',
    },
  });
  console.log('Login API status:', loginRes.status());

  // 1. Super Admin Dashboard
  console.log(`[Section 6] 2. Visiting Super Admin Dashboard at ${BASE_URL}/super-admin/dashboard...`);
  await page.goto(`${BASE_URL}/super-admin/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '23-super-admin-dashboard.png') });
  console.log('✅ Captured: assets/screenshots/23-super-admin-dashboard.png');

  // 2. Organizations Table
  console.log(`[Section 6] 3. Visiting Organizations list at ${BASE_URL}/super-admin/organizations...`);
  await page.goto(`${BASE_URL}/super-admin/organizations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '24-super-admin-organizations.png') });
  console.log('✅ Captured: assets/screenshots/24-super-admin-organizations.png');

  // 3. Override Plan Modal
  console.log(`[Section 6] 4. Opening Override Plan Modal...`);
  const overrideBtn = page.getByRole('button', { name: /Override Plan/i }).first();
  if (await overrideBtn.isVisible()) {
    await overrideBtn.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '25-super-admin-lifetime-override.png') });
  console.log('✅ Captured: assets/screenshots/25-super-admin-lifetime-override.png');

  // Close modal if open
  const closeBtn = page.getByRole('button', { name: /Close|Cancel/i }).first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click().catch(() => {});
  }

  // 4. Platform Settings
  console.log(`[Section 6] 5. Visiting Platform Settings at ${BASE_URL}/super-admin/settings...`);
  await page.goto(`${BASE_URL}/super-admin/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '26-super-admin-platform-settings.png') });
  console.log('✅ Captured: assets/screenshots/26-super-admin-platform-settings.png');

  // 5. Platform Audit Log
  console.log(`[Section 6] 6. Visiting Platform Audit Log at ${BASE_URL}/super-admin/audit-log...`);
  await page.goto(`${BASE_URL}/super-admin/audit-log`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '27-super-admin-audit-log.png') });
  console.log('✅ Captured: assets/screenshots/27-super-admin-audit-log.png');

  await browser.close();
  console.log('🎉 Section 6 Testing Complete!');
}

runSection6().catch((err) => {
  console.error('Section 6 failed:', err);
  process.exit(1);
});
