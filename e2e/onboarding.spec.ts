import { test, expect } from '@playwright/test'

test.describe('Onboarding & Workspace Creation Flow', () => {
  test('displays signup form with all required inputs and validations', async ({ page }) => {
    await page.goto('/signup')

    // Verify page title and header
    await expect(page.locator('h2')).toContainText('Create organization workspace')

    // Verify presence of input fields
    const fullNameInput = page.locator('input[type="text"]').first()
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitBtn = page.locator('button[type="submit"]')

    await expect(fullNameInput).toBeVisible()
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toContainText('Create Workspace')
  })

  test('walks through multi-step onboarding wizard to dashboard', async ({ page }) => {
    // Set dev_super_admin cookie to allow navigating onboarding & dashboard
    await page.context().addCookies([
      {
        name: 'dev_super_admin',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.goto('/onboarding')

    // Step 1: Org Info
    await expect(page.locator('text=Innoventix Setup')).toBeVisible()
    await expect(page.locator('text=Org Info')).toBeVisible()

    // Fill Step 1
    const nextBtn = page.locator('button:has-text("Continue")')
    await expect(nextBtn).toBeVisible()
    await nextBtn.click()

    // Step 2: Invite Team
    await expect(page.locator('text=Invite Team')).toBeVisible()
    const step2NextBtn = page.locator('button:has-text("Continue"), button:has-text("Skip for now")').first()
    await step2NextBtn.click()

    // Step 3: Choose Plan
    await expect(page.locator('text=Choose your workspace plan')).toBeVisible()
    await expect(page.locator('text=Starter Plan')).toBeVisible()
    await expect(page.locator('text=Pro Plan')).toBeVisible()
    await expect(page.locator('text=Enterprise Plan')).toBeVisible()

    const step3NextBtn = page.locator('button:has-text("Start 14-Day Free Trial")')
    await step3NextBtn.click()

    // Step 4: Completion
    await expect(page.locator('text=is Ready!')).toBeVisible()
    const launchBtn = page.locator('button:has-text("Go to Dashboard")')
    await expect(launchBtn).toBeVisible()

    // Clicking launch routes to dashboard
    await launchBtn.click()
    await page.waitForURL('**/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
    expect(page.url()).toContain('/dashboard')
  })
})
