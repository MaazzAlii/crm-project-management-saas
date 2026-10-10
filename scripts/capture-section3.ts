import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'assets/screenshots');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || process.env.ADMIN_EMAIL || 'admin@innoventix.io';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || process.env.ADMIN_PASSWORD || 'AdminPassword123!';

async function runSection3() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log(`[Section 3] 1. Logging in as super admin...`);
  const loginRes = await context.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });
  console.log('Login API status:', loginRes.status());

  console.log(`[Section 3] 2. Visiting Clients Directory at ${BASE_URL}/clients...`);
  await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-crm-clients-list.png') });
  console.log('✅ Captured: assets/screenshots/09-crm-clients-list.png');

  console.log(`[Section 3] 3. Visiting New Client Form at ${BASE_URL}/clients/new...`);
  await page.goto(`${BASE_URL}/clients/new`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-crm-add-client-modal.png') });
  console.log('✅ Captured: assets/screenshots/10-crm-add-client-modal.png');

  console.log(`[Section 3] 4. Visiting Client Detail at ${BASE_URL}/clients/b8d7b14f-3926-47b3-b10a-1f99d7d3dcda...`);
  await page.goto(`${BASE_URL}/clients/b8d7b14f-3926-47b3-b10a-1f99d7d3dcda`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-crm-client-detail.png') });
  console.log('✅ Captured: assets/screenshots/11-crm-client-detail.png');

  console.log(`[Section 3] 5. Visiting Sales Pipeline Kanban at ${BASE_URL}/leads...`);
  await page.goto(`${BASE_URL}/leads`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-crm-leads-kanban.png') });
  console.log('✅ Captured: assets/screenshots/12-crm-leads-kanban.png');

  console.log(`[Section 3] 6. Opening AI Lead Score Breakdown Modal...`);
  const scoreBadge = page.locator('button:has-text("% High"), button:has-text("% Med"), button:has-text("% Low")').first();
  if (await scoreBadge.isVisible()) {
    await scoreBadge.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13-crm-lead-score-breakdown.png') });
  console.log('✅ Captured: assets/screenshots/13-crm-lead-score-breakdown.png');

  await browser.close();
  console.log('🎉 Section 3 Testing Complete!');
}

runSection3().catch((err) => {
  console.error('Section 3 failed:', err);
  process.exit(1);
});
