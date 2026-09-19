import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/session', () => ({
  getCurrentSessionContext: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/billing/plan-limits', () => ({
  checkClientLimit: vi.fn(),
}))

vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(true),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { checkClientLimit } from '@/lib/billing/plan-limits'
import { logAuditEvent } from '@/lib/audit/logger'
import { createClientAction, deleteClientAction } from '@/app/(dashboard)/clients/actions'

describe('Integration: Client CRUD Server Actions with RLS & Audit', () => {
  const mockOrgId = 'org-integration-1'
  const mockUserId = 'usr-admin-1'

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getCurrentSessionContext as any).mockResolvedValue({
      user: { id: mockUserId, email: 'admin@integration.com' },
      organization: { id: mockOrgId, name: 'Integration Org' },
      role: 'admin',
      isSuperAdmin: false,
    })
    ;(checkClientLimit as any).mockResolvedValue({
      allowed: true,
      currentCount: 5,
      maxLimit: 25,
    })
  })

  describe('createClientAction', () => {
    it('successfully creates client with sanitization, tenant scoping, and audit logging', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'new-client-uuid-123' },
            error: null,
          }),
        }),
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: mockInsert,
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const formData = new FormData()
      formData.set('name', 'Acme Innovations <script>alert(1)</script>')
      formData.set('company', 'Acme Corp')
      formData.set('email', 'contact@acme.com')
      formData.set('platform', 'WhatsApp')
      formData.set('communication_mode', 'connected')

      const result = await createClientAction(formData)

      expect(result.success).toBe(true)
      expect(result.clientId).toBe('new-client-uuid-123')

      // Verifies sanitization (no <script> tags) and org scoping
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: mockOrgId,
          name: 'Acme Innovations', // Script tag stripped by sanitizeString
          email: 'contact@acme.com',
          communication_mode: 'connected',
        })
      )

      // Verifies audit logging
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockUserId,
          action: 'CLIENT_CREATED',
          targetId: 'new-client-uuid-123',
          details: expect.objectContaining({
            organizationId: mockOrgId,
          }),
        })
      )
    })

    it('blocks client creation when plan limit is reached', async () => {
      ;(checkClientLimit as any).mockResolvedValue({
        allowed: false,
        currentCount: 25,
        maxLimit: 25,
      })

      const formData = new FormData()
      formData.set('name', 'Limit Exceeded Client')
      formData.set('email', 'limit@example.com')

      const result = await createClientAction(formData)
      expect(result.error).toContain("You've reached your plan's client limit")
    })

    it('rejects invalid inputs with validation error', async () => {
      const formData = new FormData()
      formData.set('name', '') // Empty name violates schema
      formData.set('email', 'not-an-email')

      const result = await createClientAction(formData)
      expect(result.error).toBeDefined()
    })
  })

  describe('deleteClientAction', () => {
    it('allows org admin to delete client and logs audit event', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: mockDelete,
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const result = await deleteClientAction('client-to-delete')
      expect(result.success).toBe(true)
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLIENT_DELETED',
          targetId: 'client-to-delete',
        })
      )
    })

    it('blocks regular members from deleting clients (RBAC enforcement)', async () => {
      ;(getCurrentSessionContext as any).mockResolvedValue({
        user: { id: 'usr-member-1', email: 'member@integration.com' },
        organization: { id: mockOrgId, name: 'Integration Org' },
        role: 'member', // regular member
        isSuperAdmin: false,
      })

      const result = await deleteClientAction('client-to-delete')
      expect(result.error).toContain('Only organization owners and admins can delete clients')
    })
  })
})
