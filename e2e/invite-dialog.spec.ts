import { test, expect } from '@playwright/test'
const { loadEnvConfig } = require('@next/env')

loadEnvConfig(process.cwd(), true)

const E2E_EMAIL = process.env.E2E_EMAIL || process.env.ADMIN_EMAIL || 'admin@innoventix.io'
const E2E_PASSWORD = process.env.E2E_PASSWORD || process.env.ADMIN_PASSWORD || 'AdminTestPassword123!'

test.describe('Prompt 34: Team Settings — Invite Member Dialog', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate via standard session login
    await page.goto('/login?redirectTo=/settings/team')
    await page.fill('input[type="email"]', E2E_EMAIL)
    await page.fill('input[type="password"]', E2E_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/settings/team', { timeout: 15000 })
  })

  test('owner sees the dialog, invalid email shows an error, valid email creates a pending invite', async ({ page }) => {
    await page.goto('/settings/team')
    await expect(page.locator('body')).toBeVisible()

    // 1. Verify Team page is loaded and Invite Member button is visible
    const inviteBtn = page.getByRole('button', { name: /Invite Member/i })
    await expect(inviteBtn).toBeVisible()

    // 2. Click Invite Member button to open the dialog
    await inviteBtn.click()

    // Verify dialog header and elements are visible
    const dialog = page.locator('[data-testid="invite-dialog"]')
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('heading', { name: /Invite Team Member/i })).toBeVisible()

    // 3. Verify seat usage line appears (from /api/billing/usage)
    const seatUsage = page.locator('[data-testid="seat-usage-line"]')
    await expect(seatUsage).toBeVisible()
    await expect(seatUsage).toContainText(/seats used/i)

    // 4. Verify role options (Owner sees admin, member, viewer)
    const roleSelect = page.locator('select[name="role"], select#role-select')
    await expect(roleSelect).toBeVisible()
    const options = await roleSelect.locator('option').allInnerTexts()
    expect(options.some((opt) => opt.toLowerCase().includes('admin'))).toBe(true)
    expect(options.some((opt) => opt.toLowerCase().includes('member'))).toBe(true)
    expect(options.some((opt) => opt.toLowerCase().includes('viewer'))).toBe(true)

    // 5. Test invalid email inline validation
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    await emailInput.fill('invalid-email-format')

    const submitBtn = page.getByRole('button', { name: /Send Invite/i })
    await submitBtn.click()

    // Error message appears next to the field
    const errorMessage = page.locator('[data-testid="email-error-message"]')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText(/valid email/i)

    // 6. Test valid email creates invitation
    const validEmail = `team_test_${Date.now()}@example.com`
    await emailInput.fill(validEmail)

    // Select role
    await roleSelect.selectOption('member')
    await submitBtn.click()

    // 7. Verify dialog closes and success notification / toast appears
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    const toast = page.locator('[data-testid="invite-toast"], [data-testid="team-toast"]')
    await expect(toast).toBeVisible({ timeout: 10000 })
    await expect(toast).toContainText(/(Invitation sent|Invite sent|successfully)/i)
  })
})
