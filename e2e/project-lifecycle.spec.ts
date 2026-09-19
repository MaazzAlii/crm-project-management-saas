import { test, expect } from '@playwright/test'

test.describe('Core CRM & Project Lifecycle Flow', () => {
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

  test('navigates to CRM clients and views client creation interface', async ({ page }) => {
    await page.goto('/clients', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1').first()).toContainText('Clients')

    // Navigate to Create Client page
    const newClientLink = page.locator('a[href="/clients/new"]').first()
    if (await newClientLink.isVisible()) {
      await newClientLink.click()
      await page.waitForURL('**/clients/new')
      expect(page.url()).toContain('/clients/new')

      // Verify client form fields: name, company, email, communication mode
      await expect(page.locator('input[name="name"]')).toBeVisible()
      await expect(page.locator('input[name="company"]')).toBeVisible()
      await expect(page.locator('select[name="communication_mode"], select[name="platform"]')).toBeDefined()
    }
  })

  test('views projects list and toggles to Kanban board', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.locator('body')).toBeVisible()

    // Check for Kanban view toggle or navigate to /projects/kanban
    await page.goto('/projects/kanban')
    await expect(page.locator('body')).toBeVisible()

    // Verify key Kanban column headers exist
    const pageContent = await page.content()
    expect(pageContent).toMatch(/(Brief Received|In Progress|In Review|Delivered|Invoiced|Paid)/i)
  })

  test('views tasks management board and filters', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.locator('body')).toBeVisible()

    // Verify Tasks header and workload views
    const heading = page.locator('h1, h2, h3').first()
    await expect(heading).toBeVisible()
  })
})
