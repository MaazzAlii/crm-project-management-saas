import { test, expect } from '@playwright/test'

test.describe('Sign-In Flow: Landing Page to Dashboard E2E', () => {
  const email = process.env.E2E_EMAIL || process.env.ADMIN_EMAIL || 'admin@innoventix.io'
  const password = process.env.E2E_PASSWORD || process.env.ADMIN_PASSWORD || 'AdminPassword123!'

  test('wrong password: stays on /login, shows inline message, does not show raw JSON', async ({ page }) => {
    // Record network requests
    const networkRequests: string[] = []
    page.on('request', (req) => {
      networkRequests.push(req.url())
    })

    await page.goto('/login')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')

    // Stays on /login
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('/login')

    // Shows inline message
    const errorAlert = page.locator('text=Invalid email or password')
    await expect(errorAlert).toBeVisible()

    // Must not show raw JSON in page body text
    const bodyText = await page.innerText('body')
    expect(bodyText).not.toContain('{"error":')
    expect(bodyText).not.toContain('{"status":')

    // Fail if any request goes to verify-email/send
    const hasVerifyEmailRequest = networkRequests.some((url) =>
      url.includes('/api/auth/verify-email/send')
    )
    expect(hasVerifyEmailRequest).toBe(false)
  })

  test('full sign-in loop: landing -> login -> dashboard -> logout repeated 3 times', async ({ page }) => {
    test.setTimeout(90000)

    for (let i = 1; i <= 3; i++) {
      const networkRequests: string[] = []
      page.on('request', (req) => {
        networkRequests.push(req.url())
      })

      // 1. Open landing page. Click Sign In. Expect URL /login and visible email field.
      await page.goto('/')
      const signInLink = page.getByRole('link', { name: 'Sign In' }).first()
      await expect(signInLink).toBeVisible()
      await signInLink.click()

      await page.waitForURL('**/login**')
      expect(page.url()).toContain('/login')
      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput).toBeVisible()

      // 2. Enter test owner's credentials. Click Sign In.
      await emailInput.fill(email)
      await page.fill('input[type="password"]', password)
      await page.click('button[type="submit"]')

      // 3. Expect dashboard URL and dashboard heading.
      await page.waitForURL('**/dashboard**', { timeout: 15000 })
      expect(page.url()).toContain('/dashboard')
      const heading = page.locator('h1', { hasText: 'Workspace Overview' }).first()
      await expect(heading).toBeVisible({ timeout: 10000 })

      // 5. Fail if any request went to verify-email/send or raw JSON is displayed
      const hasVerifyEmail = networkRequests.some((url) =>
        url.includes('/api/auth/verify-email/send')
      )
      expect(hasVerifyEmail).toBe(false)

      const bodyText = await page.innerText('body')
      expect(bodyText).not.toContain('{"error":')
      expect(bodyText).not.toContain('{"accessToken":')

      // 4. Log out.
      const userButton = page.locator('header button').last()
      if (await userButton.isVisible()) {
        await userButton.click()
        const signOutButton = page.locator('button', { hasText: 'Sign Out' })
        if (await signOutButton.isVisible()) {
          await signOutButton.click()
          await page.waitForURL('**/login**')
        } else {
          await page.request.post('/api/auth/logout')
          await page.context().clearCookies()
          await page.goto('/login')
        }
      } else {
        await page.request.post('/api/auth/logout')
        await page.context().clearCookies()
        await page.goto('/login')
      }
    }
  })
})
