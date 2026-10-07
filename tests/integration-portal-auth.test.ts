import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/session', () => ({
  getCurrentSessionContext: vi.fn(),
  deleteRefreshTokenCookie: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}))

vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(true),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
}))

import { getCurrentSessionContext } from '@/lib/auth/session'
import { queryOne } from '@/lib/db'
import { requirePortalSession, inviteClientToPortal } from '@/lib/portal/auth'

describe('Integration: Client Portal Authentication & Session Scoping', () => {
  const mockOrgId = 'org-portal-1'
  const mockClientId = 'client-portal-1'
  const mockUserId = 'usr-client-1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requirePortalSession', () => {
    it('successfully validates active portal user with plan access', async () => {
      ;(getCurrentSessionContext as any).mockResolvedValue({
        user: { id: mockUserId, email: 'client@domain.com' },
      })

      ;(queryOne as any).mockImplementation((sql: string) => {
        if (sql.includes('client_users')) {
          return Promise.resolve({
            id: 'cu-1',
            client_id: mockClientId,
            organization_id: mockOrgId,
            is_active: true,
          })
        }
        if (sql.includes('organization_subscriptions')) {
          return Promise.resolve({
            feature_limits: { client_portal_enabled: true },
          })
        }
        return Promise.resolve(null)
      })

      const session = await requirePortalSession()
      expect(session.clientId).toBe(mockClientId)
      expect(session.organizationId).toBe(mockOrgId)
      expect(session.clientUser.is_active).toBe(true)
    })

    it('redirects to /client/login when no authenticated user session exists', async () => {
      ;(getCurrentSessionContext as any).mockResolvedValue(null)

      await expect(requirePortalSession()).rejects.toThrow('NEXT_REDIRECT:/client/login')
    })

    it('redirects to /client/login?error=no_portal_access when user has no client_users record', async () => {
      ;(getCurrentSessionContext as any).mockResolvedValue({
        user: { id: 'unauthorized-user' },
      })
      ;(queryOne as any).mockResolvedValue(null)

      await expect(requirePortalSession()).rejects.toThrow('NEXT_REDIRECT:/client/login?error=no_portal_access')
    })

    it('redirects when organization plan does not permit client portal', async () => {
      ;(getCurrentSessionContext as any).mockResolvedValue({
        user: { id: mockUserId },
      })

      ;(queryOne as any).mockImplementation((sql: string) => {
        if (sql.includes('client_users')) {
          return Promise.resolve({
            id: 'cu-1',
            client_id: mockClientId,
            organization_id: mockOrgId,
            is_active: true,
          })
        }
        if (sql.includes('organization_subscriptions')) {
          return Promise.resolve({
            feature_limits: { client_portal_enabled: false },
          })
        }
        return Promise.resolve(null)
      })

      await expect(requirePortalSession()).rejects.toThrow('NEXT_REDIRECT:/client/login?error=portal_not_available')
    })
  })

  describe('inviteClientToPortal', () => {
    it('blocks invitation if calling member is not an org owner or admin', async () => {
      ;(getCurrentSessionContext as any).mockResolvedValue({
        user: { id: 'usr-member' },
      })

      ;(queryOne as any).mockImplementation((sql: string) => {
        if (sql.includes('organization_members')) {
          return Promise.resolve({ role: 'member' })
        }
        return Promise.resolve(null)
      })

      const result = await inviteClientToPortal(mockClientId, 'client@acme.com', mockOrgId)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Only org owners and admins can invite clients')
    })

    it('blocks invitation when client portal is not included in the plan', async () => {
      ;(getCurrentSessionContext as any).mockResolvedValue({
        user: { id: 'usr-admin' },
      })

      ;(queryOne as any).mockImplementation((sql: string) => {
        if (sql.includes('organization_members')) {
          return Promise.resolve({ role: 'admin' })
        }
        if (sql.includes('organization_subscriptions')) {
          return Promise.resolve({
            feature_limits: { client_portal_enabled: false },
          })
        }
        return Promise.resolve(null)
      })

      const result = await inviteClientToPortal(mockClientId, 'client@acme.com', mockOrgId)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Client Portal is not available on your current plan')
    })
  })
})
