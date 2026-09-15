const { chromium } = require('playwright');
const path = require('path');

const artifactDir = 'C:\\Users\\maaza\\.gemini\\antigravity-ide\\brain\\009f722a-bb2f-4380-91b7-ff4f2d5939e1';

async function run() {
  console.log('1. Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // STEP 1: Navigate to /leads (Sales Pipeline Kanban)
  console.log('Navigating to http://localhost:3000/leads...');
  await page.goto('http://localhost:3000/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  // Screenshot 1: Kanban Board
  const kanbanPath = path.join(artifactDir, 'sales_pipeline_kanban.png');
  await page.screenshot({ path: kanbanPath, fullPage: true });
  console.log('Saved Screenshot 1 (Sales Pipeline Kanban):', kanbanPath);

  // STEP 2: Open Quick Lead Modal
  console.log('Clicking Add Deal button...');
  const addBtn = page.locator('button', { hasText: 'Add Deal' }).first();
  await addBtn.click({ force: true });
  await page.waitForTimeout(1500);

  // Fill in deal details
  console.log('Filling deal details...');
  await page.fill('input[name="name"]', 'Enterprise Prospect');
  await page.fill('input[name="company"]', 'Global Enterprise Inc');
  await page.fill('input[name="deal_value"]', '25000');
  await page.selectOption('select[name="pipeline_stage"]', 'proposal_sent');

  // Screenshot 2: Quick Lead Modal
  const modalPath = path.join(artifactDir, 'quick_lead_modal.png');
  await page.screenshot({ path: modalPath, fullPage: true });
  console.log('Saved Screenshot 2 (Quick Lead Modal):', modalPath);

  // Submit deal
  console.log('Submitting new deal...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  // STEP 3: Screenshot 3 - Updated Kanban Board
  console.log('Verifying updated Kanban Board...');
  await page.goto('http://localhost:3000/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  const updatedKanbanPath = path.join(artifactDir, 'sales_pipeline_updated_kanban.png');
  await page.screenshot({ path: updatedKanbanPath, fullPage: true });
  console.log('Saved Screenshot 3 (Updated Kanban Board):', updatedKanbanPath);

  await browser.close();
  console.log('All Task 26 verification screenshots captured successfully!');
}

run().catch(err => {
  console.error('Error during capture execution:', err);
  process.exit(1);
});
