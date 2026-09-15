const { chromium } = require('playwright');
const path = require('path');

const artifactDir = 'C:\\Users\\maaza\\.gemini\\antigravity-ide\\brain\\009f722a-bb2f-4380-91b7-ff4f2d5939e1';

async function run() {
  console.log('1. Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // STEP 1: Navigate to /clients/new and create a test client
  console.log('Navigating to http://localhost:3000/clients/new...');
  await page.goto('http://localhost:3000/clients/new', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  await page.fill('input[name="name"]', 'Acme Global Corp');
  await page.fill('input[name="company"]', 'Acme Global LLC');
  await page.fill('input[name="email"]', 'contact@acmeglobal.com');
  await page.fill('input[name="phone"]', '+1 (555) 019-2831');
  await page.fill('input[name="country"]', 'United States');

  const connectedCard = page.locator('text=Connected Hub').first();
  if (await connectedCard.isVisible()) {
    await connectedCard.click();
  }

  console.log('Clicking Save Client...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  // STEP 2: Navigate to client detail page
  console.log('Navigating to client directory...');
  await page.goto('http://localhost:3000/clients', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  const clientLink = page.locator('a', { hasText: 'Acme Global Corp' }).first();
  if (await clientLink.isVisible()) {
    await clientLink.click();
    await page.waitForTimeout(2500);
  }

  console.log('Current Detail URL:', page.url());

  // Screenshot 1: Overview Tab
  const detailOverviewPath = path.join(artifactDir, 'client_detail_overview.png');
  await page.screenshot({ path: detailOverviewPath, fullPage: true });
  console.log('Saved Screenshot 1 (Client Detail Overview):', detailOverviewPath);

  // STEP 3: Open Edit Modal
  console.log('Opening Edit Profile modal...');
  const editBtn = page.locator('button', { hasText: 'Edit Profile' }).first();
  if (await editBtn.isVisible()) {
    await editBtn.click();
    await page.waitForTimeout(1000);
  }

  // Screenshot 2: Edit Modal
  const editModalPath = path.join(artifactDir, 'client_detail_edit_modal.png');
  await page.screenshot({ path: editModalPath, fullPage: true });
  console.log('Saved Screenshot 2 (Client Edit Modal):', editModalPath);

  // Close modal
  const closeBtn = page.locator('button', { hasText: 'Cancel' }).first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  // STEP 4: Switch to Activity Log Tab
  console.log('Switching to Activity Log tab...');
  const activityTab = page.locator('button', { hasText: 'Activity Log' }).first();
  if (await activityTab.isVisible()) {
    await activityTab.click();
    await page.waitForTimeout(1000);
  }

  // Screenshot 3: Activity Log Tab
  const activityLogPath = path.join(artifactDir, 'client_detail_activity_log.png');
  await page.screenshot({ path: activityLogPath, fullPage: true });
  console.log('Saved Screenshot 3 (Client Activity Log Tab):', activityLogPath);

  await browser.close();
  console.log('All Task 25 verification screenshots captured successfully!');
}

run().catch(err => {
  console.error('Error during capture execution:', err);
  process.exit(1);
});
