import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'assets/screenshots');
const PROJECT_ID = 'c6f17969-43c5-4cfc-b27d-91516c5c1d8a';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || process.env.ADMIN_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || process.env.ADMIN_PASSWORD || '';

async function runSection4() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log(`[Section 4] 1. Logging in as super admin...`);
  const loginRes = await context.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });
  console.log('Login API status:', loginRes.status());

  console.log(`[Section 4] 2. Visiting Projects Directory at ${BASE_URL}/projects...`);
  await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14-projects-list.png') });
  console.log('✅ Captured: assets/screenshots/14-projects-list.png');

  console.log(`[Section 4] 3. Visiting Projects Kanban at ${BASE_URL}/projects/kanban...`);
  await page.goto(`${BASE_URL}/projects/kanban`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15-projects-kanban.png') });
  console.log('✅ Captured: assets/screenshots/15-projects-kanban.png');

  console.log(`[Section 4] 4. Visiting Project Detail with Deliverables at ${BASE_URL}/projects/${PROJECT_ID}...`);
  await page.goto(`${BASE_URL}/projects/${PROJECT_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17-project-detail-deliverables.png') });
  console.log('✅ Captured: assets/screenshots/17-project-detail-deliverables.png');

  console.log(`[Section 4] 5. Opening Deliver Project Confirmation Modal...`);
  const statusSelect = page.locator('select').first();
  if (await statusSelect.isVisible()) {
    await statusSelect.selectOption('Delivered');
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16-project-deliver-modal.png') });
  console.log('✅ Captured: assets/screenshots/16-project-deliver-modal.png');

  console.log(`[Section 4] 6. Visiting Tasks Workload Board at ${BASE_URL}/tasks...`);
  await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18-tasks-workload-board.png') });
  console.log('✅ Captured: assets/screenshots/18-tasks-workload-board.png');

  await browser.close();
  console.log('🎉 Section 4 Testing Complete!');
}

runSection4().catch((err) => {
  console.error('Section 4 failed:', err);
  process.exit(1);
});
