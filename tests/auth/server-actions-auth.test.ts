import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as sessionModule from '@/lib/auth/session'
import * as db from '@/lib/db'

// Import server actions to test
import { deleteTagAction } from '@/app/(dashboard)/clients/tags/actions'
import { deleteGlobalTaskAction } from '@/app/(dashboard)/tasks/actions'
import { deleteProjectTemplateAction } from '@/app/(dashboard)/settings/templates/actions'
import { saveSlackIntegrationAction, disconnectSlackIntegrationAction } from '@/app/(dashboard)/settings/integrations/slack/actions'
import { saveEmailIntegrationAction, disconnectEmailIntegrationAction } from '@/app/(dashboard)/settings/integrations/email/actions'
import { completeOnboarding } from '@/app/actions/onboarding'
import { markMessageReadAction } from '@/app/(dashboard)/inbox/actions'
import { markNotificationAsReadAction } from '@/app/(dashboard)/notifications/actions'
import { deleteClientAction } from '@/app/(dashboard)/clients/actions'
import { deleteProjectAction } from '@/app/(dashboard)/projects/actions'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth/session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/session')>()
  return {
    ...actual,
    getCurrentSessionContext: vi.fn(),
  }
})

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>()
  return {
    ...actual,
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    queryOne: vi.fn().mockResolvedValue(null),
  }
})

vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}))

describe('Item 7: Server Actions Authentication, Role Guard & Tenancy Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Unauthenticated Requests Rejected Across All Actions', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue(null as any)
    })

    it('rejects deleteTagAction without session', async () => {
      const res = await deleteTagAction('tag-1')
      expect(res.error).toMatch(/unauthorized/i)
    })

    it('rejects deleteGlobalTaskAction without session', async () => {
      const res = await deleteGlobalTaskAction('task-1')
      expect(res.error).toMatch(/unauthorized/i)
    })

    it('rejects deleteProjectTemplateAction without session', async () => {
      const res = await deleteProjectTemplateAction('template-1')
      expect(res.error).toMatch(/unauthorized/i)
    })

    it('rejects saveSlackIntegrationAction without session', async () => {
      const formData = new FormData()
      formData.set('external_account_id', 'C12345')
      const res = await saveSlackIntegrationAction(formData)
      expect(res.error).toMatch(/unauthorized/i)
    })

    it('rejects disconnectSlackIntegrationAction without session', async () => {
      const res = await disconnectSlackIntegrationAction('chan-1')
      expect(res.error).toMatch(/unauthorized/i)
    })

    it('rejects completeOnboarding without session', async () => {
      const res = await completeOnboarding({ organizationId: 'org-1', industryType: 'tech' })
      expect(res.error).toMatch(/unauthorized/i)
      expect(res.success).toBe(false)
    })

    it('rejects markMessageReadAction without session', async () => {
      const res = await markMessageReadAction('msg-1')
      expect(res.error).toMatch(/unauthorized/i)
      expect(res.success).toBe(false)
    })

    it('rejects markNotificationAsReadAction without session', async () => {
      const res = await markNotificationAsReadAction('notif-1')
      expect(res.error).toMatch(/unauthorized/i)
      expect(res.success).toBe(false)
    })

    it('rejects deleteClientAction without session', async () => {
      const res = await deleteClientAction('client-1')
      expect(res.error).toMatch(/unauthorized/i)
    })

    it('rejects deleteProjectAction without session', async () => {
      const res = await deleteProjectAction('project-1')
      expect(res.error).toMatch(/unauthorized/i)
    })
  })

  describe('2. Privileged Operations Require Owner or Admin Roles', () => {
    beforeEach(() => {
      // Mock session as non-admin 'member'
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: { id: 'usr-member', email: 'member@acme.com' },
        organization: { id: 'org-acme', name: 'Acme Corp' },
        role: 'member',
        isSuperAdmin: false,
      } as any)
    })

    it('prevents member from deleting tags', async () => {
      const res = await deleteTagAction('tag-1')
      expect(res.error).toMatch(/forbidden.*owners and admins/i)
    })

    it('prevents member from deleting tasks', async () => {
      const res = await deleteGlobalTaskAction('task-1')
      expect(res.error).toMatch(/forbidden.*owners and admins/i)
    })

    it('prevents member from deleting project templates', async () => {
      const res = await deleteProjectTemplateAction('template-1')
      expect(res.error).toMatch(/forbidden.*owners and admins/i)
    })

    it('prevents member from configuring slack integration', async () => {
      const formData = new FormData()
      formData.set('external_account_id', 'C12345')
      const res = await saveSlackIntegrationAction(formData)
      expect(res.error).toMatch(/forbidden.*owners and admins/i)
    })

    it('prevents member from configuring email integration', async () => {
      const formData = new FormData()
      formData.set('external_account_id', 'support@agency.com')
      const res = await saveEmailIntegrationAction(formData)
      expect(res.error).toMatch(/forbidden.*owners and admins/i)
    })

    it('prevents member from completing onboarding', async () => {
      const res = await completeOnboarding({ organizationId: 'org-acme', industryType: 'tech' })
      expect(res.error).toMatch(/forbidden.*owners and admins/i)
      expect(res.success).toBe(false)
    })

    it('prevents member from deleting clients', async () => {
      const res = await deleteClientAction('client-1')
      expect(res.error).toMatch(/forbidden.*owners and admins/i)
    })

    it('prevents member from deleting projects', async () => {
      const res = await deleteProjectAction('project-1')
      expect(res.error).toMatch(/forbidden.*owners and admins/i)
    })
  })

  describe('3. Multi-Tenancy Scoping Enforcement & Mismatch Rejection', () => {
    it('rejects onboarding completion when client-supplied organizationId mismatches active session', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: { id: 'usr-admin', email: 'admin@acme.com' },
        organization: { id: 'org-acme', name: 'Acme Corp' },
        role: 'owner',
        isSuperAdmin: false,
      } as any)

      const res = await completeOnboarding({
        organizationId: 'org-victim',
        industryType: 'finance',
      })

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/organization not found/i)
    })

    it('scopes SQL queries by session.organization.id on authorized actions', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: { id: 'usr-owner', email: 'owner@acme.com' },
        organization: { id: 'org-acme', name: 'Acme Corp' },
        role: 'owner',
        isSuperAdmin: false,
      } as any)

      await deleteTagAction('tag-99')

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/organization_id = \$2/i),
        ['tag-99', 'org-acme']
      )
    })
  })
})
