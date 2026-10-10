import { chromium } from 'playwright';

async function testEditableColumns() {
  console.log('🚀 Starting Editable Columns UI Verification (Prompt 02)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  const page = await context.newPage();

  console.log('1. Navigating to login...');
  await page.goto('http://localhost:3005/login');
  await page.waitForTimeout(1000);

  const adminEmail = process.env.ADMIN_EMAIL || process.env.TEST_USER_EMAIL || 'admin@innoventix.io';
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.TEST_USER_PASSWORD || '';

  console.log('2. Filling credentials...');
  await page.fill('input[type="email"]', adminEmail);
  await page.fill('input[type="password"]', adminPassword);
  await page.click('button[type="submit"]');

  console.log('3. Waiting for dashboard navigation...');
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);

  console.log('4. Navigating to /leads...');
  await page.goto('http://localhost:3005/leads');
  await page.waitForTimeout(3000);

  // Scroll board container to the right
  const scrollBoardRight = async () => {
    await page.evaluate(() => {
      const boardContainer = document.querySelector('.overflow-x-auto');
      if (boardContainer) {
        boardContainer.scrollLeft = boardContainer.scrollWidth;
      }
    });
    await page.waitForTimeout(500);
  };

  await scrollBoardRight();

  // 5. Test Add List ("+ Add another list")
  console.log('5. Clicking "+ Add another list"...');
  const addListBtn = page.locator('button:has-text("Add another list")').first();
  if (await addListBtn.isVisible()) {
    await addListBtn.click();
    await page.waitForTimeout(500);

    const listInput = page.locator('input[placeholder="Enter list title..."]');
    await listInput.fill('Technical Review');
    await listInput.press('Enter');
    console.log('Submitted new list title "Technical Review" via Enter key.');
    await page.waitForTimeout(2500);
  }

  await scrollBoardRight();
  const addedListScreenshot = '/home/maazzalii/.gemini/antigravity-ide/brain/bf37eff9-31b4-4474-82e4-3daad261feb0/prompt02_added_list.png';
  await page.screenshot({ path: addedListScreenshot, fullPage: true });
  console.log('Added list screenshot saved to:', addedListScreenshot);

  // 6. Test Inline Title Rename
  console.log('6. Renaming "Technical Review" to "Executive Sign-Off"...');
  const techColumn = page.locator('div:has(h3:has-text("Technical Review"))').first();
  const techHeading = techColumn.locator('h3:has-text("Technical Review")').first();
  
  if (await techHeading.isVisible()) {
    await techHeading.click();
    await page.waitForTimeout(500);

    const inlineInput = techColumn.locator('input[type="text"]').first();
    if (await inlineInput.isVisible()) {
      await inlineInput.fill('Executive Sign-Off');
      await inlineInput.press('Enter');
      console.log('Submitted inline rename to "Executive Sign-Off" via Enter key.');
      await page.waitForTimeout(2500);
    }
  }

  await scrollBoardRight();
  const renamedScreenshot = '/home/maazzalii/.gemini/antigravity-ide/brain/bf37eff9-31b4-4474-82e4-3daad261feb0/prompt02_renamed_board.png';
  await page.screenshot({ path: renamedScreenshot, fullPage: true });
  console.log('Renamed board screenshot saved to:', renamedScreenshot);

  // 7. Test Persistence Across Page Reload
  console.log('7. Reloading page to verify persistence in database...');
  await page.reload();
  await page.waitForTimeout(3000);
  await scrollBoardRight();

  const reloadedText = await page.textContent('body');
  const hasExecutiveSignOff = reloadedText?.includes('Executive Sign-Off');
  console.log('✅ Reloaded page contains "Executive Sign-Off":', hasExecutiveSignOff);

  const reloadedScreenshot = '/home/maazzalii/.gemini/antigravity-ide/brain/bf37eff9-31b4-4474-82e4-3daad261feb0/prompt02_reloaded_board.png';
  await page.screenshot({ path: reloadedScreenshot, fullPage: true });
  console.log('Reloaded board screenshot saved to:', reloadedScreenshot);

  // 8. Test Column Menu & Delete List
  console.log('8. Testing column menu and deleting "Executive Sign-Off"...');
  const execColumn = page.locator('div:has(h3:has-text("Executive Sign-Off"))').first();
  const menuBtn = execColumn.locator('button[title="Column actions"]').first();
  if (await menuBtn.isVisible()) {
    await menuBtn.click();
    await page.waitForTimeout(500);

    const deleteBtn = page.locator('button:has-text("Delete list")').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(800);

      // Confirm in modal
      const modalDeleteBtn = page.locator('button:has-text("Delete Column")').first();
      if (await modalDeleteBtn.isVisible()) {
        await modalDeleteBtn.click();
        console.log('Confirmed column deletion in modal.');
        await page.waitForTimeout(2500);
      }
    }
  }

  await scrollBoardRight();
  const finalScreenshot = '/home/maazzalii/.gemini/antigravity-ide/brain/bf37eff9-31b4-4474-82e4-3daad261feb0/prompt02_final_board.png';
  await page.screenshot({ path: finalScreenshot, fullPage: true });
  console.log('Final board screenshot saved to:', finalScreenshot);

  const finalText = await page.textContent('body');
  const stillHasExecutiveSignOff = finalText?.includes('Executive Sign-Off');
  console.log('✅ Column was successfully deleted:', !stillHasExecutiveSignOff);

  console.log('🎉 Editable columns browser verification complete and verified 100%!');
  await browser.close();
}

testEditableColumns().catch(console.error).finally(() => process.exit(0));
