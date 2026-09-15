const { chromium } = require('playwright');
const path = require('path');

const artifactDir = 'C:\\Users\\maaza\\.gemini\\antigravity-ide\\brain\\009f722a-bb2f-4380-91b7-ff4f2d5939e1';

async function run() {
  console.log('1. Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // STEP 1: Screenshot 1 - Empty Clients List
  console.log('Navigating to http://localhost:3000/clients (initial empty state)...');
  await page.goto('http://localhost:3000/clients', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const emptyListPath = path.join(artifactDir, 'clients_empty_list.png');
  await page.screenshot({ path: emptyListPath, fullPage: true });
  console.log('Saved Screenshot 1 (Empty List):', emptyListPath);

  // STEP 2: Screenshot 2 - Create Client Form
  console.log('Navigating to http://localhost:3000/clients/new...');
  await page.goto('http://localhost:3000/clients/new', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Fill in form fields
  console.log('Filling form fields...');
  await page.fill('input[name="name"]', 'Test Client');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="phone"]', '+1234567890');
  await page.fill('input[name="country"]', 'United States');

  // Select Communication Mode "Connected"
  const connectedCard = page.locator('div').filter({ hasText: /^Connected Hub/ }).first();
  if (await connectedCard.isVisible()) {
    await connectedCard.click();
  }

  const newFormPath = path.join(artifactDir, 'clients_new_form.png');
  await page.screenshot({ path: newFormPath, fullPage: true });
  console.log('Saved Screenshot 2 (New Form):', newFormPath);

  // Submit form
  console.log('Submitting client form...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // STEP 3: Screenshot 3 - Clients List with Created Client
  console.log('Navigating/Verifying on http://localhost:3000/clients after creation...');
  await page.goto('http://localhost:3000/clients', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const populatedListPath = path.join(artifactDir, 'clients_populated_list.png');
  await page.screenshot({ path: populatedListPath, fullPage: true });
  console.log('Saved Screenshot 3 (Populated List):', populatedListPath);

  await browser.close();
  console.log('All 3 verification screenshots captured successfully!');
}

run().catch(err => {
  console.error('Error during capture execution:', err);
  process.exit(1);
});
