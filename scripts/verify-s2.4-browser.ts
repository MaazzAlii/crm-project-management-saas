import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { loadEnvConfig } from '@next/env'
import { generateAccessToken } from '../lib/auth/jwt'

loadEnvConfig(process.cwd())

async function runBrowserVerification() {
  const screenshotsDir = path.join(process.cwd(), 'assets', 'screenshots', 'ISSUE-S2.4')
  fs.mkdirSync(screenshotsDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })

  console.log('[Playwright] Starting browser verification for ISSUE-S2.4...')

  // Generate authenticated session for owner of test org
  const token = generateAccessToken({
    userId: 'afad24c7-700b-40a5-b64e-be3a43f06a5f',
    email: 'owner_seats_1791776486655_95hpz@example.com',
    role: 'org_admin',
    orgId: '52e114a2-2a8f-48a6-9e91-fc9f3fd44af0',
  })

  // 1. Team page in Light Mode
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
    })
    await context.addCookies([
      {
        name: 'innoventix_session',
        value: token,
        domain: 'localhost',
        path: '/',
      },
    ])
    const page = await context.newPage()
    const response = await page.goto('http://localhost:3000/settings/team', { waitUntil: 'networkidle' })
    console.log(`[Playwright] /settings/team (Light Mode) status: ${response?.status()}`)
    await page.screenshot({ path: path.join(screenshotsDir, '01-team-page-light.png'), fullPage: true })
    await context.close()
  }

  // 2. Team page in Dark Mode
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'dark',
    })
    await context.addCookies([
      {
        name: 'innoventix_session',
        value: token,
        domain: 'localhost',
        path: '/',
      },
    ])
    const page = await context.newPage()
    const response = await page.goto('http://localhost:3000/settings/team', { waitUntil: 'networkidle' })
    console.log(`[Playwright] /settings/team (Dark Mode) status: ${response?.status()}`)
    await page.screenshot({ path: path.join(screenshotsDir, '02-team-page-dark.png'), fullPage: true })
    await context.close()
  }

  // 3. Invite Member Dialog in Light Mode
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
    })
    await context.addCookies([
      {
        name: 'innoventix_session',
        value: token,
        domain: 'localhost',
        path: '/',
      },
    ])
    const page = await context.newPage()
    await page.goto('http://localhost:3000/settings/team', { waitUntil: 'networkidle' })
    const inviteBtn = page.getByRole('button', { name: /Invite Member/i })
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click()
      await page.waitForTimeout(500)
      console.log('[Playwright] Opened Invite Member Dialog (Light Mode)')
    }
    await page.screenshot({ path: path.join(screenshotsDir, '03-invite-dialog-light.png'), fullPage: true })
    await context.close()
  }

  // 4. Revoke confirmation dialog / Pending list in Dark Mode
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'dark',
    })
    await context.addCookies([
      {
        name: 'innoventix_session',
        value: token,
        domain: 'localhost',
        path: '/',
      },
    ])
    const page = await context.newPage()
    await page.goto('http://localhost:3000/settings/team', { waitUntil: 'networkidle' })
    
    // Check if revoke buttons are present in pending list
    const revokeBtns = page.locator('button[title="Revoke invitation"]')
    const count = await revokeBtns.count()
    console.log(`[Playwright] Found ${count} revoke button(s) in pending invitations`)
    if (count > 0) {
      await revokeBtns.first().click()
      await page.waitForTimeout(500)
      console.log('[Playwright] Opened Revoke Confirmation Modal (Dark Mode)')
    }
    await page.screenshot({ path: path.join(screenshotsDir, '04-revoke-dialog-dark.png'), fullPage: true })
    await context.close()
  }

  await browser.close()
  console.log('[Playwright] Verification complete. Screenshots saved to assets/screenshots/ISSUE-S2.4/')
}

runBrowserVerification().catch((err) => {
  console.error('[Playwright] Error during verification:', err)
  process.exit(1)
})
