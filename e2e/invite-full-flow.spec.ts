import { test, expect } from '@playwright/test'
const { loadEnvConfig } = require('@next/env')

loadEnvConfig(process.cwd(), true)

const E2E_EMAIL = process.env.E2E_EMAIL || process.env.ADMIN_EMAIL || 'admin@innoventix.io'
const E2E_PASSWORD = process.env.E2E_PASSWORD || process.env.ADMIN_PASSWORD || 'AdminTestPassword123!'

test.describe('Prompt 50: E2E — Invite and Accept Full Multi-Browser Flow', () => {
  test('Owner invites user, invitee registers/accepts, owner sees new member and revoked link is invalid', async ({ browser, request }) => {
    const { query: dbQuery } = require('../lib/db')
    const { invalidatePlanCache } = require('../lib/billing/current-plan')
    invalidatePlanCache()
    await dbQuery("DELETE FROM invitations WHERE lower(email) LIKE '%e2e%'")

    // 1. Log in through the API and reuse the session cookie with Playwright's storageState
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: E2E_EMAIL,
        password: E2E_PASSWORD,
      },
    })
    expect(loginRes.ok()).toBeTruthy()

    const storageState = await request.storageState()

    // Browser Context A: Owner with storageState session cookie
    const ownerContext = await browser.newContext({ storageState })
    const ownerPage = await ownerContext.newPage()
    ownerPage.on('pageerror', (err) => console.log('OWNER PAGE ERROR:', err))
    ownerPage.on('console', (msg) => console.log('OWNER CONSOLE:', msg.type(), msg.text()))

    await ownerPage.goto('/settings/team')

    const inviteeEmail = `invitee_e2e_${Date.now()}@example.com`

    // Open invite dialog
    const inviteBtn = ownerPage.getByRole('button', { name: /Invite Member/i })
    await expect(inviteBtn).toBeVisible()
    await inviteBtn.click()

    const emailInput = ownerPage.locator('input[type="email"], input[name="email"]')
    await emailInput.fill(inviteeEmail)

    // Wait for the invitation API response and click Send Invite
    const [inviteRes] = await Promise.all([
      ownerPage.waitForResponse(
        (resp) => resp.url().includes('/api/invitations') && resp.request().method() === 'POST'
      ),
      ownerPage.getByRole('button', { name: /Send Invite/i }).click(),
    ])
    expect(inviteRes.ok()).toBeTruthy()
    const inviteJson = await inviteRes.json()
    const inviteLink = inviteJson.data?.inviteLink
    const rawToken = inviteLink ? inviteLink.split('/invite/')[1] : null
    expect(rawToken).toBeTruthy()

    // 2. Verify invite appears in PendingInvitationsList
    const pendingList = ownerPage.locator('[data-testid="pending-invitations-list"]')
    await expect(pendingList).toBeVisible({ timeout: 10000 })
    await expect(pendingList).toContainText(inviteeEmail)

    // 3. Browser Context B: Invitee registers and accepts invitation
    const inviteeContext = await browser.newContext()
    const inviteePage = await inviteeContext.newPage()

    // Invitee registers account
    const signupRes = await inviteeContext.request.post('/api/auth/signup', {
      data: {
        email: inviteeEmail,
        password: 'InviteePassword123!',
        fullName: 'E2E Invitee User',
      },
    })
    expect(signupRes.ok()).toBeTruthy()

    // Invitee accepts invitation
    const acceptRes = await inviteeContext.request.post('/api/invitations/accept', {
      data: { token: rawToken },
    })
    expect(acceptRes.ok()).toBeTruthy()
    const acceptData = await acceptRes.json()
    expect(acceptData.success).toBeTruthy()

    // 4. Verify owner's member list shows the invitee exactly once
    await ownerPage.reload()
    const memberRows = ownerPage.locator('tbody tr', { hasText: inviteeEmail })
    await expect(memberRows).toHaveCount(1)

    // 5. Revoke a second invite and verify invalid message
    const secondEmail = `revoke_test_${Date.now()}@example.com`
    await inviteBtn.click()
    await ownerPage.locator('input[type="email"], input[name="email"]').fill(secondEmail)
    const [secondInviteRes] = await Promise.all([
      ownerPage.waitForResponse(
        (resp) => resp.url().includes('/api/invitations') && resp.request().method() === 'POST'
      ),
      ownerPage.getByRole('button', { name: /Send Invite/i }).click(),
    ])
    expect(secondInviteRes.ok()).toBeTruthy()
    const secondData = await secondInviteRes.json()
    const secondToken = secondData.data?.inviteLink?.split('/invite/')[1]

    await expect(pendingList).toContainText(secondEmail, { timeout: 10000 })

    // Click revoke button on second invite
    const row = ownerPage.locator('tr', { hasText: secondEmail })
    const revokeBtn = row.getByTitle('Revoke invitation')
    await expect(revokeBtn).toBeVisible()
    await revokeBtn.click()

    const confirmRevoke = ownerPage.getByRole('button', { name: /Confirm Revoke/i })
    await expect(confirmRevoke).toBeVisible()
    await Promise.all([
      ownerPage.waitForResponse(
        (resp) => resp.url().includes('/revoke') && resp.request().method() === 'POST'
      ),
      confirmRevoke.click(),
    ])

    if (secondToken) {
      const revokedInfoRes = await inviteeContext.request.get(`/api/invitations/accept-info?token=${secondToken}`)
      const revokedJson = await revokedInfoRes.json()
      expect(revokedJson.success).toBeFalsy()
    }

    // Cleanup contexts
    await ownerContext.close()
    await inviteeContext.close()
  })
})
