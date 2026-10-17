import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { loadEnvConfig } from '@next/env'
import { generateAccessToken } from '../../../lib/auth/jwt'
import { query } from '../../../lib/db'

loadEnvConfig(process.cwd())

async function run() {
  const screenshotsDir = path.join(process.cwd(), 'assets', 'screenshots', 'ISSUE-S2.4')
  fs.mkdirSync(screenshotsDir, { recursive: true })

  const orgId = 'fc7d74c3-eea8-43a6-bc49-4451ca7fe2cd'
  const userId = '655eefc7-a539-4f91-9e09-157f81232413'
  const testEmail = `expired_revoketest_${Date.now()}@example.com`

  console.log('Inserting test expired invite...')
  const insertRes = await query(
    `INSERT INTO invitations (
      organization_id, email, role, token_hash, status, expires_at, created_at, updated_at
    ) VALUES (
      $1, $2, 'member', $3, 'pending', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW()
    ) RETURNING id, email, status, expires_at`,
    [orgId, testEmail, `hash_${Date.now()}`]
  )
  const testInvite = insertRes.rows[0]

  const token = generateAccessToken({
    userId,
    email: 'owner_seats_1792228382511_8u2yn@example.com',
    role: 'org_admin',
    orgId,
  })

  const browser = await chromium.launch({ headless: true })

  try {
    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        colorScheme: theme,
      })
      await context.addCookies([
        { name: 'innoventix_session', value: token, domain: 'localhost', path: '/' },
      ])
      const page = await context.newPage()
      await page.goto('http://localhost:3000/settings/team', { waitUntil: 'networkidle' })

      const themeBtn = page.locator(`button[aria-label="${theme === 'light' ? 'Light' : 'Dark'} theme"]`)
      if (await themeBtn.isVisible()) {
        await themeBtn.click()
        await page.waitForTimeout(300)
      }

      const row = page.locator('tr', { hasText: testEmail })
      await row.waitFor({ state: 'visible', timeout: 5000 })

      const revokeBtn = row.locator('button[title="Revoke invitation"]')
      await revokeBtn.waitFor({ state: 'visible', timeout: 5000 })
      await revokeBtn.click()

      const modal = page.locator('[data-testid="revoke-invite-modal"]')
      await modal.waitFor({ state: 'visible', timeout: 5000 })

      const modalClass = await modal.getAttribute('class')
      console.log(`[Theme: ${theme.toUpperCase()}] Modal classList: ${modalClass}`)
      const hasBackdropBlur = modalClass?.includes('backdrop-blur')
      console.log(`[Theme: ${theme.toUpperCase()}] Has backdrop-blur?: ${hasBackdropBlur}`)

      const computedOverlayStyle = await modal.evaluate((el) => {
        const s = window.getComputedStyle(el)
        return {
          position: s.position,
          top: s.top,
          marginTop: s.marginTop,
          backdropFilter: s.backdropFilter || (s as any).webkitBackdropFilter || 'none',
        }
      })
      console.log(`[Theme: ${theme.toUpperCase()}] Computed Overlay Style:`, JSON.stringify(computedOverlayStyle, null, 2))

      const modalShotPath = path.join(screenshotsDir, `09-revoke-modal-noblur-${theme}.png`)
      await page.screenshot({ path: modalShotPath, fullPage: false })
      console.log(`[Theme: ${theme.toUpperCase()}] Modal screenshot (viewport-only) saved to: ${modalShotPath}`)

      const confirmBtn = modal.locator('button', { hasText: 'Confirm Revoke' })
      await confirmBtn.click()

      await page.waitForTimeout(1000)

      const isModalVisible = await modal.isVisible()
      const toast = page.locator('[data-testid="pending-invite-toast"]')
      await toast.waitFor({ state: 'visible', timeout: 5000 })
      const toastText = (await toast.innerText()).trim()

      console.log(`[Theme: ${theme.toUpperCase()}] Modal visible after confirm: ${isModalVisible}`)
      console.log(`[Theme: ${theme.toUpperCase()}] Toast text: "${toastText}"`)

      const shotName = theme === 'light' ? '03-after-light.png' : '04-after-dark.png'
      const shotPath = path.join(screenshotsDir, shotName)
      await page.screenshot({ path: shotPath, fullPage: false })
      console.log(`[Theme: ${theme.toUpperCase()}] Screenshot saved to: ${shotPath}`)

      await context.close()
    }
  } finally {
    await query(`DELETE FROM invitations WHERE id = $1`, [testInvite.id])
    await browser.close()
  }

  console.log('DONE')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
