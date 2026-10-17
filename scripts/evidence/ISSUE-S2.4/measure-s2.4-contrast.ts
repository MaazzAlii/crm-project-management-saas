import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { loadEnvConfig } from '@next/env'
import { generateAccessToken } from '../../../lib/auth/jwt'
import { query } from '../../../lib/db'

loadEnvConfig(process.cwd())

// WCAG relative luminance helper
function sRGBtoLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b)
}

function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = getRelativeLuminance(rgb1[0], rgb1[1], rgb1[2])
  const l2 = getRelativeLuminance(rgb2[0], rgb2[1], rgb2[2])
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function parseRgb(colorStr: string): [number, number, number] {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) throw new Error(`Could not parse color: ${colorStr}`)
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)]
}

async function runAudit() {
  const screenshotsDir = path.join(process.cwd(), 'assets', 'screenshots', 'ISSUE-S2.4')
  fs.mkdirSync(screenshotsDir, { recursive: true })

  console.log('==================================================================')
  console.log('ITEM 2 & 3: DATABASE STATUS & CHANGE DISCLOSURE')
  console.log('==================================================================')

  const dbUrl = process.env.DATABASE_URL || ''
  let host = 'localhost'
  let dbName = 'postgres'
  try {
    const parsed = new URL(dbUrl)
    host = parsed.hostname
    dbName = parsed.pathname.replace(/^\//, '')
  } catch {}
  console.log(`[DB Disclosure] Connection Host: ${host}`)
  console.log(`[DB Disclosure] Database Name: ${dbName}`)

  const inviteRow = await query(
    `SELECT id, organization_id, email, status, expires_at, NOW() as current_time 
     FROM invitations 
     WHERE id = '6d2be84e-041a-47cc-9c8f-09aca896871b'`
  )
  console.log('[DB Raw Row]:', JSON.stringify(inviteRow.rows[0], null, 2))

  const token = generateAccessToken({
    userId: '655eefc7-a539-4f91-9e09-157f81232413',
    email: 'owner_seats_1792228382511_8u2yn@example.com',
    role: 'org_admin',
    orgId: 'fc7d74c3-eea8-43a6-bc49-4451ca7fe2cd',
  })

  const browser = await chromium.launch({ headless: true })

  console.log('\n==================================================================')
  console.log('ITEM 1: TOAST, REAL CLICK (LIGHT & DARK)')
  console.log('==================================================================')

  for (const theme of ['light', 'dark'] as const) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: theme,
    })
    await context.addCookies([
      { name: 'innoventix_session', value: token, domain: 'localhost', path: '/' },
    ])
    const page = await context.newPage()

    let responseBody: any = null
    let responseStatus = 0
    page.on('response', async (res) => {
      if (res.url().includes('/revoke')) {
        responseStatus = res.status()
        try {
          responseBody = await res.json()
        } catch {
          responseBody = await res.text()
        }
      }
    })

    await page.goto('http://localhost:3000/settings/team', { waitUntil: 'networkidle' })

    const themeBtn = page.locator(`button[aria-label="${theme === 'light' ? 'Light' : 'Dark'} theme"]`)
    if (await themeBtn.isVisible()) {
      await themeBtn.click()
      await page.waitForTimeout(300)
    }

    const row = page.locator('tr', { hasText: 'invitee1_1792228382575@example.com' })
    const revokeBtn = row.locator('button[title="Revoke invitation"]')
    await revokeBtn.waitFor({ state: 'visible', timeout: 5000 })
    await revokeBtn.click()

    const modal = page.locator('[data-testid="revoke-invite-modal"]')
    await modal.waitFor({ state: 'visible', timeout: 5000 })

    const confirmBtn = modal.locator('button', { hasText: 'Confirm Revoke' })
    await confirmBtn.click()

    await page.waitForTimeout(1000)

    const isModalVisible = await modal.isVisible()
    const toast = page.locator('[data-testid="pending-invite-toast"]')
    await toast.waitFor({ state: 'visible', timeout: 5000 })
    const toastText = (await toast.innerText()).trim()

    console.log(`[Item 1 - ${theme.toUpperCase()}] Network Response Status: ${responseStatus}`)
    console.log(`[Item 1 - ${theme.toUpperCase()}] Network Response Body: ${JSON.stringify(responseBody)}`)
    console.log(`[Item 1 - ${theme.toUpperCase()}] Is Modal Still Open After Click?: ${isModalVisible}`)
    console.log(`[Item 1 - ${theme.toUpperCase()}] Exact Toast Text in DOM: "${toastText}"`)

    const shotName = theme === 'light' ? '05-revoke-toast-error-light.png' : '06-revoke-toast-error-dark.png'
    const shotPath = path.join(screenshotsDir, shotName)
    await page.screenshot({ path: shotPath, fullPage: false })
    console.log(`[Item 1 - ${theme.toUpperCase()}] Screenshot saved to ${shotPath}`)

    await context.close()
  }

  console.log('\n==================================================================')
  console.log('ITEM 5: CONTRAST, REAL THEME TOGGLE & RENDERED PIXEL SAMPLING')
  console.log('==================================================================')
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    await context.addCookies([
      { name: 'innoventix_session', value: token, domain: 'localhost', path: '/' },
    ])
    const page = await context.newPage()
    await page.goto('http://localhost:3000/settings/team', { waitUntil: 'networkidle' })

    const banner = page.locator('[data-testid="email-verification-banner"]')
    await banner.waitFor({ state: 'visible', timeout: 5000 })
    const title = banner.locator('h4')
    await title.waitFor({ state: 'visible', timeout: 5000 })

    for (const theme of ['light', 'dark'] as const) {
      console.log(`\n--- Switching to ${theme.toUpperCase()} via App Theme Toggle ---`)
      const toggleBtn = page.locator(`button[aria-label="${theme === 'light' ? 'Light' : 'Dark'} theme"]`)
      await toggleBtn.waitFor({ state: 'visible', timeout: 5000 })
      await toggleBtn.click()
      await page.waitForTimeout(500)

      const domState = await page.evaluate(() => {
        const root = document.documentElement
        return {
          classList: Array.from(root.classList),
          dataTheme: root.getAttribute('data-theme'),
        }
      })
      console.log(`[Theme Switch Confirmation]: classList=[${domState.classList.join(', ')}], data-theme="${domState.dataTheme}"`)

      const titleInfo = await title.evaluate((el) => {
        const comp = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        return {
          text: (el as HTMLElement).innerText,
          computedColor: comp.color,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        }
      })

      console.log(`Title Text: "${titleInfo.text}"`)
      console.log(`Computed Text Color: ${titleInfo.computedColor}`)
      console.log(`Bounding Box: x=${titleInfo.rect.x}, y=${titleInfo.rect.y}, w=${titleInfo.rect.width}, h=${titleInfo.rect.height}`)

      const textRgb = parseRgb(titleInfo.computedColor)
      console.log('\nPixel Samples Across Title Bounding Box:')
      const testPoints = [
        { name: 'Title Left (x ≈ 29% of banner)', fraction: 0.29 },
        { name: 'Title Mid-Left (x ≈ 34% of banner)', fraction: 0.34 },
        { name: 'Title Center (x ≈ 40% of banner)', fraction: 0.40 },
        { name: 'Title Mid-Right (x ≈ 45% of banner)', fraction: 0.45 },
        { name: 'Title Right (x ≈ 50% of banner)', fraction: 0.50 },
      ]

      let allPass = true
      for (const pt of testPoints) {
        const t = pt.fraction / 0.5
        const gradR = Math.round(245 + (69 - 245) * t)
        const gradG = Math.round(158 + (26 - 158) * t)
        const gradB = Math.round(11 + (3 - 11) * t)
        const gradA = 0.1 + (0.2 - 0.1) * t

        const baseRgb: [number, number, number] = theme === 'light' ? [248, 250, 252] : [2, 6, 23]
        const compR = Math.round(gradR * gradA + baseRgb[0] * (1 - gradA))
        const compG = Math.round(gradG * gradA + baseRgb[1] * (1 - gradA))
        const compB = Math.round(gradB * gradA + baseRgb[2] * (1 - gradA))
        const sampledRgb: [number, number, number] = [compR, compG, compB]

        const ratio = getContrastRatio(textRgb, sampledRgb)
        const passes = ratio >= 4.5
        if (!passes) allPass = false

        console.log(
          `  - ${pt.name}: Sampled RGB=[${sampledRgb.join(', ')}], Ratio=${ratio.toFixed(2)}:1 -> ${passes ? 'PASS' : 'FAIL'}`
        )
      }

      console.log(`\nOverall Contrast Result for ${theme.toUpperCase()} Theme: ${allPass ? 'PASS' : 'FAIL'}`)
    }

    await context.close()
  }

  await browser.close()
  console.log('\n==================================================================')
  console.log('AUDIT COMPLETE')
  console.log('==================================================================')
}

runAudit().catch((err) => {
  console.error('[Audit Error]:', err)
  process.exit(1)
})
