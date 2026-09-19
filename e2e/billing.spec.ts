import { test, expect } from '@playwright/test'

test.describe('Billing, Plan Usage & Quota Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Add dev session cookie for authenticated tenant workspace access
    await page.context().addCookies([
      {
        name: 'dev_super_admin',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
    ])
  })

  test('views billing settings with subscription details and plan usage cards', async ({ page }) => {
    await page.goto('/settings/billing')
    await expect(page.locator('body')).toBeVisible()

    // Verify billing settings header and plan info
    const content = await page.content()
    expect(content).toMatch(/(Billing & Subscription|Subscription|Plan Usage|Upgrade Plan)/i)

    // Verify key plan usage categories appear
    expect(content).toMatch(/(Team Members|Active Clients|Projects|Cloud Storage)/i)
  })

  test('navigates to analytics plan usage reporting dashboard', async ({ page }) => {
    await page.goto('/analytics/plan-usage')
    await expect(page.locator('body')).toBeVisible()

    // Verify plan usage analytics view
    const content = await page.content()
    expect(content).toMatch(/(Plan Usage|Resource Utilization|Quota|Limits)/i)
  })

  test('views revenue reporting overview', async ({ page }) => {
    await page.goto('/analytics/revenue')
    await expect(page.locator('body')).toBeVisible()

    // Verify revenue analytics view
    const content = await page.content()
    expect(content).toMatch(/(Revenue|Historical Revenue|Billing Schedule|Cash Flow)/i)
  })
})
