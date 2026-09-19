import { test, expect } from '@playwright/test'

test.describe('Client Portal Authentication & Scoped Isolation', () => {
  test('displays client portal login with magic link request', async ({ page }) => {
    await page.goto('/client/login')

    // Verify Portal branding and login form
    await expect(page.locator('body')).toContainText('Client Portal')
    await expect(page.locator('input[type="email"]')).toBeVisible()

    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toContainText(/Sign in with Magic Link|Send Magic Link|Log in/i)
  })

  test('displays appropriate error banners when redirected with error parameters', async ({ page }) => {
    // 1. No portal access error
    await page.goto('/client/login?error=no_portal_access')
    await expect(page.locator('body')).toContainText(/No active client portal account found|portal access/i)

    // 2. Portal not available on plan error
    await page.goto('/client/login?error=portal_not_available')
    await expect(page.locator('body')).toContainText(/not enabled|not available/i)
  })

  test('redirects unauthenticated access on protected portal routes back to login', async ({ page }) => {
    // Without portal session, visiting /client/dashboard must redirect to /client/login
    await page.goto('/client/dashboard')
    await page.waitForURL('**/client/login**')
    expect(page.url()).toContain('/client/login')

    // Visiting /client/settings must redirect to /client/login
    await page.goto('/client/settings')
    await page.waitForURL('**/client/login**')
    expect(page.url()).toContain('/client/login')
  })
})
