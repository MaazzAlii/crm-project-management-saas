import { test, expect } from '@playwright/test'

test.describe('Super Admin Platform Management & Org Suspension', () => {
  test('blocks unauthenticated access to super admin routes', async ({ page }) => {
    // Clear all cookies
    await page.context().clearCookies()

    await page.goto('/super-admin/dashboard', { waitUntil: 'domcontentloaded' })
    // Middleware must redirect unauthenticated users to login
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('allows verified super admin to view platform dashboard and metrics', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'dev_super_admin',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.goto('/super-admin/dashboard')
    await expect(page.locator('body')).toBeVisible()

    const content = await page.content()
    expect(content).toMatch(/(Platform Overview|Super Admin|Total Organizations|Active Subscriptions|Platform Health)/i)
  })

  test('views organizations list and navigates to organization details', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'dev_super_admin',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.goto('/super-admin/organizations')
    await expect(page.locator('body')).toBeVisible()

    // Verify organization list table
    const content = await page.content()
    expect(content).toMatch(/(Organizations|Innoventix Hub|Plan Tier|Status)/i)

    // Navigate to organization detail
    await page.goto('/super-admin/organizations/00000000-0000-0000-0000-000000000001')
    await expect(page.locator('body')).toBeVisible()

    const detailContent = await page.content()
    expect(detailContent).toMatch(/(Organization Details|Subscription|Impersonate|Suspend Organization)/i)
  })

  test('verifies suspended organization route displays suspension notice', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'dev_super_admin',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.goto('/org-suspended')
    await expect(page.locator('body')).toBeVisible()

    const content = await page.content()
    expect(content).toMatch(/(Organization Suspended|Access Suspended|Contact Support)/i)
  })
})
