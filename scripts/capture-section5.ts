import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'assets/screenshots');

async function runSection5() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log(`[Section 5] 1. Logging in as super admin...`);
  const loginRes = await context.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: 'maazalisshahid@gmail.com',
      password: 'pas#123#',
    },
  });
  console.log('Login API status:', loginRes.status());

  console.log(`[Section 5] 2. Visiting Unified Inbox at ${BASE_URL}/inbox...`);
  await page.goto(`${BASE_URL}/inbox`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19-unified-inbox.png') });
  console.log('✅ Captured: assets/screenshots/19-unified-inbox.png');

  console.log(`[Section 5] 3. Triggering AI Reply Suggestions...`);
  const aiSuggestBtn = page.getByRole('button', { name: /Suggest Reply/i }).first();
  if (await aiSuggestBtn.isVisible()) {
    await aiSuggestBtn.click();
    await page.waitForTimeout(3000);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20-ai-reply-suggestions.png') });
  console.log('✅ Captured: assets/screenshots/20-ai-reply-suggestions.png');

  console.log(`[Section 5] 4. Triggering AI Task Extraction Modal...`);
  const extractTasksBtn = page.getByRole('button', { name: /Extract Tasks/i }).first();
  if (await extractTasksBtn.isVisible()) {
    await extractTasksBtn.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '21-ai-task-extraction-modal.png') });
  console.log('✅ Captured: assets/screenshots/21-ai-task-extraction-modal.png');

  console.log(`[Section 5] 5. Visiting Channel Integrations at ${BASE_URL}/settings/integrations...`);
  await page.goto(`${BASE_URL}/settings/integrations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '22-channel-integrations.png') });
  console.log('✅ Captured: assets/screenshots/22-channel-integrations.png');

  await browser.close();
  console.log('🎉 Section 5 Testing Complete!');
}

runSection5().catch((err) => {
  console.error('Section 5 failed:', err);
  process.exit(1);
});
