import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(true),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
}))

import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/logger'
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
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: mockUserId, email: 'client@domain.com' } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === 'client_users') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: 'cu-1',
                        client_id: mockClientId,
                        organization_id: mockOrgId,
                        is_active: true,
                      },
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'organization_subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        subscription_plans: {
                          feature_limits: { client_portal_enabled: true },
                        },
                      },
                    }),
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const session = await requirePortalSession()
      expect(session.clientId).toBe(mockClientId)
      expect(session.organizationId).toBe(mockOrgId)
      expect(session.clientUser.is_active).toBe(true)
    })

    it('redirects to /client/login when no authenticated user session exists', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      await expect(requirePortalSession()).rejects.toThrow('NEXT_REDIRECT:/client/login')
    })

    it('redirects to /client/login?error=no_portal_access when user has no client_users record', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'unauthorized-user' } },
          }),
          signOut: vi.fn().mockResolvedValue({}),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }),
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      await expect(requirePortalSession()).rejects.toThrow('NEXT_REDIRECT:/client/login?error=no_portal_access')
    })

    it('redirects when organization plan does not permit client portal', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === 'client_users') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: 'cu-1',
                        client_id: mockClientId,
                        organization_id: mockOrgId,
                        is_active: true,
                      },
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'organization_subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        subscription_plans: {
                          feature_limits: { client_portal_enabled: false },
                        },
                      },
                    }),
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      await expect(requirePortalSession()).rejects.toThrow('NEXT_REDIRECT:/client/login?error=portal_not_available')
    })
  })

  describe('inviteClientToPortal', () => {
    it('blocks invitation if calling member is not an org owner or admin', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'usr-member' } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === 'organization_members') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { role: 'member' }, // regular member, not owner/admin
                    }),
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const result = await inviteClientToPortal(mockClientId, 'client@acme.com', mockOrgId)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Only org owners and admins can invite clients')
    })

    it('blocks invitation when client portal is not included in the plan', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'usr-admin' } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === 'organization_members') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { role: 'admin' },
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'organization_subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        subscription_plans: {
                          feature_limits: { client_portal_enabled: false },
                        },
                      },
                    }),
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const result = await inviteClientToPortal(mockClientId, 'client@acme.com', mockOrgId)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Client Portal is not available on your current plan')
    })
  })
})
