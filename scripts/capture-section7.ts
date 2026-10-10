import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'assets/screenshots');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || process.env.ADMIN_EMAIL || 'admin@innoventix.io';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || process.env.ADMIN_PASSWORD || 'AdminPassword123!';

async function runSection7() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log(`[Section 7] 1. Logging in as super admin...`);
  const loginRes = await context.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });
  console.log('Login API status:', loginRes.status());

  // 1. Team Settings
  console.log(`[Section 7] 2. Visiting Team Settings at ${BASE_URL}/settings/team...`);
  await page.goto(`${BASE_URL}/settings/team`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '28-settings-team.png') });
  console.log('✅ Captured: assets/screenshots/28-settings-team.png');

  // 2. Organization Profile Settings
  console.log(`[Section 7] 3. Visiting Organization Settings at ${BASE_URL}/settings/organization...`);
  await page.goto(`${BASE_URL}/settings/organization`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '29-settings-organization.png') });
  console.log('✅ Captured: assets/screenshots/29-settings-organization.png');

  // 3. Project Templates
  console.log(`[Section 7] 4. Visiting Project Templates at ${BASE_URL}/settings/templates...`);
  await page.goto(`${BASE_URL}/settings/templates`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '30-settings-project-templates.png') });
  console.log('✅ Captured: assets/screenshots/30-settings-project-templates.png');

  // 4. AI Controls & Usage
  console.log(`[Section 7] 5. Visiting AI Controls at ${BASE_URL}/settings/ai...`);
  await page.goto(`${BASE_URL}/settings/ai`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '31-settings-ai-controls.png') });
  console.log('✅ Captured: assets/screenshots/31-settings-ai-controls.png');

  // 5. Billing Settings (Lifetime Tier)
  console.log(`[Section 7] 6. Visiting Billing at ${BASE_URL}/settings/billing...`);
  await page.goto(`${BASE_URL}/settings/billing`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '32-settings-billing-lifetime.png') });
  console.log('✅ Captured: assets/screenshots/32-settings-billing-lifetime.png');

  // 6. Client Portal Login (Open in a fresh context without auth cookies)
  console.log(`[Section 7] 7. Visiting Client Portal Login at ${BASE_URL}/client/login...`);
  const clientContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const clientPage = await clientContext.newPage();
  await clientPage.goto(`${BASE_URL}/client/login`, { waitUntil: 'networkidle' });
  await clientPage.waitForTimeout(1000);
  await clientPage.screenshot({ path: path.join(SCREENSHOT_DIR, '33-client-portal-login.png') });
  console.log('✅ Captured: assets/screenshots/33-client-portal-login.png');

  await browser.close();
  console.log('🎉 Section 7 Testing Complete!');
}

runSection7().catch((err) => {
  console.error('Section 7 failed:', err);
  process.exit(1);
});
