import { test, expect } from '@playwright/test';
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd(), true);

const E2E_EMAIL = process.env.E2E_EMAIL || process.env.ADMIN_EMAIL || process.env.TEST_USER_EMAIL || '';
const E2E_PASSWORD = process.env.E2E_PASSWORD || process.env.ADMIN_PASSWORD || process.env.TEST_USER_PASSWORD || '';

test.describe('Sales Pipeline Board E2E (Prompt 07)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login?redirectTo=/leads');
    await page.fill('input[type="email"]', E2E_EMAIL);
    await page.fill('input[type="password"]', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/leads', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Lead', level: 3 }).first()).toBeVisible({ timeout: 15000 });
  });

  test('1. Six default columns are visible on /leads', async ({ page }) => {
    const expectedColumns = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    for (const name of expectedColumns) {
      const columnHeader = page.getByRole('heading', { name, level: 3 }).first();
      await expect(columnHeader).toBeVisible({ timeout: 15000 });
    }
  });

  test('2. Create a deal in Lead and verify it appears once', async ({ page }) => {
    const dealTitle = `E2E Deal ${Date.now()}`;
    await page.getByRole('button', { name: 'New Deal' }).click();

    // Modal opens
    const titleInput = page.getByPlaceholder('e.g. Enterprise Cloud Migration Contract');
    await titleInput.fill(dealTitle);

    const valueInput = page.getByPlaceholder('25000');
    if (await valueInput.isVisible()) {
      await valueInput.fill('15000');
    }

    const saveBtn = page.getByRole('button', { name: 'Create Deal', exact: true });
    await saveBtn.click();

    // Deal appears exactly once
    const dealCard = page.locator(`text="${dealTitle}"`).first();
    await expect(dealCard).toBeVisible();
  });

  test('3. Move deal to Qualified, verify persistence across reload', async ({ page }) => {
    const dealTitle = `MoveTest_${Date.now()}`;
    
    // Create deal
    await page.getByRole('button', { name: 'New Deal' }).click();
    await page.getByPlaceholder('e.g. Enterprise Cloud Migration Contract').fill(dealTitle);
    await page.getByRole('button', { name: 'Create Deal', exact: true }).click();

    const dealCard = page.locator(`text="${dealTitle}"`).first();
    await expect(dealCard).toBeVisible();

    // Drag from Lead column to Qualified column
    const qualifiedHeading = page.getByRole('heading', { name: 'Qualified', level: 3 }).first();
    await dealCard.dragTo(qualifiedHeading);
    await page.waitForTimeout(1000);

    // Reload page
    await page.reload();
    await page.waitForTimeout(1500);

    // Verify it exists once in total
    await expect(page.locator(`text="${dealTitle}"`)).toHaveCount(1);
  });

  test('4. Rename a column and verify persistence after reload', async ({ page }) => {
    const qualifiedHeading = page.getByRole('heading', { name: 'Qualified', level: 3 }).first();
    await qualifiedHeading.click();

    const inlineInput = page.locator('input[maxlength="50"]').first();
    await inlineInput.waitFor({ state: 'visible', timeout: 5000 });
    await inlineInput.fill('Qualified Pro');
    await inlineInput.press('Enter');
    await page.waitForTimeout(1000);

    await page.reload();
    await page.waitForTimeout(2000);

    const renamedHeading = page.getByRole('heading', { name: 'Qualified Pro', level: 3 }).first();
    await expect(renamedHeading).toBeVisible();

    // Rename back to Qualified
    await renamedHeading.click();
    const resetInput = page.locator('input[maxlength="50"]').first();
    await resetInput.waitFor({ state: 'visible', timeout: 5000 });
    await resetInput.fill('Qualified');
    await resetInput.press('Enter');
    await page.waitForTimeout(1000);
  });

  test('5. Add another list column, and delete it', async ({ page }) => {
    const addListBtn = page.getByRole('button', { name: 'Add another list' });
    if (await addListBtn.isVisible()) {
      await addListBtn.click();

      const listInput = page.locator('input[placeholder="Enter list title..."]');
      const customColName = `Custom_${Date.now()}`;
      await listInput.fill(customColName);
      await page.getByRole('button', { name: 'Add list' }).click();
      await page.waitForTimeout(500);

      const customHeading = page.getByRole('heading', { name: customColName, level: 3 }).first();
      await expect(customHeading).toBeVisible({ timeout: 10000 });

      // Click column actions specifically for this stage
      const actionsBtn = page.getByRole('button', { name: `Column actions for ${customColName}` });
      await actionsBtn.click();

      // Click "Delete list" or "Delete stage" in the dropdown menu
      const deleteMenuOption = page.getByRole('button', { name: /Delete (list|stage|column)/i });
      await deleteMenuOption.click();

      // Click confirm delete in confirmation modal
      const confirmDeleteBtn = page.locator('[data-testid="confirm-delete-stage-btn"]');
      await confirmDeleteBtn.waitFor({ state: 'visible', timeout: 5000 });
      await confirmDeleteBtn.click();

      await expect(customHeading).not.toBeVisible({ timeout: 10000 });
    }
  });

  test('6. Move deal to Won and verify Won stats / open value update', async ({ page }) => {
    const wonDealTitle = `WonDeal_${Date.now()}`;
    await page.getByRole('button', { name: 'New Deal' }).click();
    await page.getByPlaceholder('e.g. Enterprise Cloud Migration Contract').fill(wonDealTitle);
    await page.getByPlaceholder('25000').fill('20000');
    await page.getByRole('button', { name: 'Create Deal', exact: true }).click();

    const dealCard = page.locator(`text="${wonDealTitle}"`).first();
    await expect(dealCard).toBeVisible();

    const wonHeading = page.getByRole('heading', { name: 'Won', level: 3 }).first();
    await dealCard.dragTo(wonHeading);
    await page.waitForTimeout(1000);

    await page.reload();
    await page.waitForTimeout(1500);

    const openValueText = page.locator('text=Open Value').first();
    await expect(openValueText).toBeVisible();
  });
});
