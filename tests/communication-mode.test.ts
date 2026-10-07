import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({
  getCurrentSessionContext: vi.fn(),
}))

vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(true),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { query, queryOne } from '@/lib/db'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { updateClientAction, switchClientToConnectedModeAction } from '@/app/(dashboard)/clients/actions'

describe('Client Communication Mode Transitions (One-Way Rule)', () => {
  const mockOrgId = 'org-111'
  const mockUserId = 'usr-222'

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getCurrentSessionContext as any).mockResolvedValue({
      user: { id: mockUserId, email: 'admin@org.com' },
      organization: { id: mockOrgId, name: 'Test Org' },
      role: 'admin',
      isSuperAdmin: false,
    })
  })

  describe('updateClientAction — Reversion Prevention', () => {
    it('blocks transition from "connected" back to "manual"', async () => {
      ;(queryOne as any).mockResolvedValue({
        communication_mode: 'connected',
      })

      const formData = new FormData()
      formData.set('name', 'Acme Corp')
      formData.set('company', 'Acme')
      formData.set('email', 'acme@test.com')
      formData.set('communication_mode', 'manual') // Attempting to revert

      const result = await updateClientAction('client-123', formData)
      expect(result.error).toBe('Connected mode is permanent and cannot be reverted to manual.')
    })

    it('allows updating other fields when client is already in "connected" mode', async () => {
      ;(queryOne as any).mockResolvedValue({
        communication_mode: 'connected',
      })
      ;(query as any).mockResolvedValue([])

      const formData = new FormData()
      formData.set('name', 'Acme Corp Updated')
      formData.set('company', 'Acme')
      formData.set('email', 'acme@test.com')
      formData.set('communication_mode', 'connected') // Preserving connected mode

      const result = await updateClientAction('client-123', formData)
      expect(result.error).toBeUndefined()
    })
  })

  describe('switchClientToConnectedModeAction', () => {
    it('successfully switches a client from "manual" to "connected" mode', async () => {
      ;(queryOne as any).mockResolvedValue({
        id: 'client-manual',
        name: 'Beta Client',
        communication_mode: 'manual',
        organization_id: mockOrgId,
      })
      ;(query as any).mockResolvedValue([])

      const result = await switchClientToConnectedModeAction('client-manual')
      expect(result.success).toBe(true)
      expect(result.message).toContain('upgraded to Connected')
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("SET communication_mode = 'connected'"),
        expect.arrayContaining(['client-manual', mockOrgId])
      )
    })

    it('is idempotent when the client is already in "connected" mode', async () => {
      ;(queryOne as any).mockResolvedValue({
        id: 'client-conn',
        name: 'Gamma Client',
        communication_mode: 'connected',
        organization_id: mockOrgId,
      })

      const result = await switchClientToConnectedModeAction('client-conn')
      expect(result.success).toBe(true)
      expect(result.message).toBe('Client is already in Connected mode.')
      expect(query).not.toHaveBeenCalled()
    })

    it('rejects switch when client is not found or belongs to another tenant', async () => {
      ;(queryOne as any).mockResolvedValue(null)

      const result = await switchClientToConnectedModeAction('non-existent-client')
      expect(result.error).toBe('Client not found in your organization.')
    })
  })
})
