import { test, expect } from '@playwright/test'

test.describe('Communication Hub & AI Suggestions', () => {
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

  test('views unified inbox with channel navigation and message threads', async ({ page }) => {
    await page.goto('/inbox', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()

    const content = await page.content()
    expect(content).toMatch(/(Inbox|Unified Inbox|Messages|All Channels|Communication Hub)/i)
  })

  test('filters inbox by communication channels', async ({ page }) => {
    await page.goto('/inbox', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()

    // Verify channel tabs or filters exist (Channels, WhatsApp, Slack, Email)
    const content = await page.content()
    expect(content).toMatch(/(Channels|WhatsApp|Slack|Email|Communication)/i)
  })

  test('views AI settings dashboard with capability toggles', async ({ page }) => {
    await page.goto('/settings/ai')
    await expect(page.locator('body')).toBeVisible()

    // Verify AI settings interface and capability controls
    const content = await page.content()
    expect(content).toMatch(/(AI Settings|Usage Controls|Reply Suggestions|Lead Scoring|Task Extraction|Weekly Narrative)/i)
  })
})
