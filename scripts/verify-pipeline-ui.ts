import { chromium } from 'playwright';

async function testPipeline() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to login...');
  await page.goto('http://localhost:3005/login');

  const bypassBtn = page.locator('button:has-text("Dev Bypass")');
  if (await bypassBtn.isVisible()) {
    console.log('Clicking Dev Bypass...');
    await bypassBtn.click();
  } else {
    await page.fill('input[type="email"]', 'admin@innoventix.io');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
  }

  console.log('2. Waiting for login navigation...');
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);

  console.log('3. Navigating to /leads...');
  await page.goto('http://localhost:3005/leads');
  await page.waitForTimeout(4000);

  const screenshotPath = '/home/maazzalii/.gemini/antigravity-ide/brain/bf37eff9-31b4-4474-82e4-3daad261feb0/local_leads_pipeline.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot saved to:', screenshotPath);

  const bodyText = await page.textContent('body');
  console.log('Page contains Sales Pipeline:', bodyText?.includes('Sales Pipeline'));
  console.log('Page contains Lead stage:', bodyText?.includes('Lead'));
  console.log('Page contains Qualified stage:', bodyText?.includes('Qualified'));
  console.log('Page contains Proposal stage:', bodyText?.includes('Proposal'));
  console.log('Page contains Negotiation stage:', bodyText?.includes('Negotiation'));
  console.log('Page contains Won stage:', bodyText?.includes('Won'));
  console.log('Page contains Lost stage:', bodyText?.includes('Lost'));

  // Test creating a deal using form
  console.log('4. Creating test deal...');
  const addBtn = page.locator('button:has-text("New Deal")').first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(1000);

    const titleInput = page.locator('input[placeholder*="Deal title" i], input[placeholder*="e.g." i]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Enterprise Cloud SLA');
    }

    const valueInput = page.locator('input[type="number"], input[placeholder="0.00"]').first();
    if (await valueInput.isVisible()) {
      await valueInput.fill('85000');
    }

    const createSubmit = page.locator('button[type="submit"]:has-text("Create Deal")').first();
    if (await createSubmit.isVisible()) {
      await createSubmit.click();
      console.log('5. Submitted deal creation modal.');
      await page.waitForTimeout(2000);
    }
  }

  // Test dragging deal card with mouse pointer
  console.log('6. Dragging deal card from Lead to Proposal stage...');
  const dealCard = page.locator('text=Enterprise Cloud SLA').first();
  const proposalColumn = page.locator('div:has-text("Proposal")').last();
  
  const dealBox = await dealCard.boundingBox();
  const targetBox = await proposalColumn.boundingBox();
  
  if (dealBox && targetBox) {
    await page.mouse.move(dealBox.x + dealBox.width / 2, dealBox.y + dealBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 150, { steps: 15 });
    await page.waitForTimeout(500);
    await page.mouse.up();
    console.log('7. Dropped deal card.');
    await page.waitForTimeout(2000);
  }

  const screenshotDragPath = '/home/maazzalii/.gemini/antigravity-ide/brain/bf37eff9-31b4-4474-82e4-3daad261feb0/local_leads_pipeline_dragged.png';
  await page.screenshot({ path: screenshotDragPath, fullPage: true });
  console.log('Dragged screenshot saved to:', screenshotDragPath);

  await browser.close();
}

testPipeline().catch(console.error).finally(() => process.exit(0));
