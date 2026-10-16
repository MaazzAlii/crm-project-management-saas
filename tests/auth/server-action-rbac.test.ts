import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as sessionModule from '@/lib/auth/session'
import * as db from '@/lib/db'

// Import server actions under test
import { logCommunicationAction } from '@/app/(dashboard)/clients/[id]/communications/actions'
import {
  createProjectAction,
  updateProjectAction,
  updateProjectStatusAction,
  createDeliverableAction,
  updateDeliverableStatusAction,
  deleteDeliverableAction,
  createProjectTaskAction,
  updateTaskStatusAction,
  updateProjectTeamAssigneeAction,
} from '@/app/(dashboard)/projects/actions'
import {
  createGlobalTaskAction,
  updateGlobalTaskAction,
  toggleGlobalTaskStatusAction,
} from '@/app/(dashboard)/tasks/actions'
import {
  assignMessageClientAction,
  sendOutboundMessageAction,
  generateReplySuggestionsAction,
  extractTasksFromThreadAction,
  createExtractedTaskAction,
} from '@/app/(dashboard)/inbox/actions'
import {
  createClientAction,
  updateClientAction,
  updateClientNotesAction,
} from '@/app/(dashboard)/clients/actions'
import {
  createTagAction,
  updateClientTagsAction,
} from '@/app/(dashboard)/clients/tags/actions'
import {
  updateLeadStageAction,
  createLeadAction,
  scoreLeadAction,
  batchScoreLeadsAction,
} from '@/app/(dashboard)/leads/actions'
import {
  generateWeeklyReportAction,
  sendWeeklyReportAction,
} from '@/app/(dashboard)/reports/actions'
import {
  createProjectTemplateAction,
  saveProjectAsTemplateAction,
} from '@/app/(dashboard)/settings/templates/actions'
import { testAICompletionAction } from '@/app/actions/ai'
import { generateAnalyticsNarrativeAction } from '@/app/actions/analytics'

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
    queryOne: vi.fn(),
    transaction: vi.fn(async (cb) => {
      const mockClient = {
        query: vi.fn(async (sql: string, params: any[]) => {
          if (sql.includes('SELECT id FROM organizations')) {
            return { rows: [{ id: params[0] }] }
          }
          if (sql.includes('INSERT INTO clients') || sql.includes('INSERT INTO projects')) {
            return { rows: [{ id: 'mock-inserted-id' }] }
          }
          return { rows: [] }
        }),
      }
      return cb(mockClient)
    }),
  }
})

vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/services/plan-limits', () => ({
  checkClientLimit: vi.fn().mockResolvedValue({ allowed: true, limit: 100, currentCount: 5 }),
  checkProjectLimit: vi.fn().mockResolvedValue({ allowed: true, limit: 100, currentCount: 5 }),
}))

vi.mock('@/lib/billing/plan-limits', () => ({
  checkClientLimit: vi.fn().mockResolvedValue({ allowed: true, limit: 100, maxLimit: 100 }),
}))

vi.mock('@/lib/ai/guard', () => ({
  checkAIAccess: vi.fn().mockResolvedValue({ allowed: true }),
}))

vi.mock('@/lib/ai/client', () => ({
  isAIAccessible: vi.fn().mockResolvedValue({ allowed: true }),
  generateAICompletion: vi.fn().mockResolvedValue({ success: true, text: 'AI response' }),
  getAIProviderConfig: vi.fn().mockReturnValue({ provider: 'test', model: 'mock' }),
}))

vi.mock('@/lib/ai/features/lead-scoring', () => ({
  scoreLead: vi.fn().mockResolvedValue({ success: true, score: 85, tier: 'high', breakdown: {} }),
}))

vi.mock('@/lib/ai/features/report-narrative', () => ({
  generateWeeklyReportNarrative: vi.fn().mockResolvedValue({ success: true, narrative: 'Great week' }),
}))

vi.mock('@/lib/ai/features/reply-suggestions', () => ({
  getReplySuggestions: vi.fn().mockResolvedValue({ success: true, suggestions: [] }),
}))

vi.mock('@/lib/ai/features/task-extraction', () => ({
  extractTasksFromMessage: vi.fn().mockResolvedValue({ success: true, tasks: [] }),
}))

vi.mock('@/lib/analytics/data', () => ({
  fetchOrganizationAnalytics: vi.fn().mockResolvedValue({
    monthlyVelocity: [],
    activeProjectsCount: 5,
    totalClientsCount: 10,
    revenue: { totalActiveValue: 50000, byStage: [] },
    totalProjects: 5,
    overdueItems: [],
  }),
}))

describe('AUTH-4 Phase B: Server Action RBAC & Cross-Tenant Tenancy Enforcement', () => {
  const orgA = 'org-tenant-alpha'
  const orgB = 'org-tenant-beta'
  const userAlpha = { id: 'usr-alpha-1', email: 'alice@alpha.com' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --------------------------------------------------------------------------
  // 1. UNAUTHENTICATED CALLERS (Missing session)
  // --------------------------------------------------------------------------
  describe('1. Missing Session Context (UNAUTHENTICATED)', () => {
    beforeEach(() => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue(null)
    })

    it('rejects createClientAction when unauthenticated', async () => {
      const fd = new FormData()
      fd.set('name', 'Acme Inc')
      await expect(createClientAction(fd)).rejects.toThrow('UNAUTHENTICATED')
    })

    it('rejects createProjectAction when unauthenticated', async () => {
      const fd = new FormData()
      fd.set('title', 'Brand Redesign')
      fd.set('client_id', 'client-1')
      await expect(createProjectAction(fd)).rejects.toThrow('UNAUTHENTICATED')
    })

    it('rejects createGlobalTaskAction when unauthenticated', async () => {
      const fd = new FormData()
      fd.set('title', 'Audit Logs')
      fd.set('project_id', 'proj-1')
      await expect(createGlobalTaskAction(fd)).rejects.toThrow('UNAUTHENTICATED')
    })

    it('rejects createProjectTemplateAction when unauthenticated', async () => {
      const fd = new FormData()
      fd.set('name', 'SaaS Onboarding Template')
      await expect(createProjectTemplateAction(fd)).rejects.toThrow('UNAUTHENTICATED')
    })
  })

  // --------------------------------------------------------------------------
  // 2. CRITICAL FIXES: CROSS-TENANT FOREIGN RESOURCE INJECTION (6 functions)
  // --------------------------------------------------------------------------
  describe('2. CRITICAL: Cross-Tenant Parent Resource Verification (NOT_FOUND)', () => {
    beforeEach(() => {
      // Caller belongs to Org A with 'member' role
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: userAlpha,
        organization: { id: orgA, name: 'Tenant Alpha Corp' },
        role: 'member',
        isSuperAdmin: false,
      } as any)
    })

    it('CRITICAL 1: logCommunicationAction rejects inserting record for Org B client', async () => {
      // Parent check query for Org B client in Org A returns null
      vi.mocked(db.queryOne).mockResolvedValue(null)

      const fd = new FormData()
      fd.set('client_id', 'client-belongs-to-org-b')
      fd.set('subject', 'Contract Terms')
      fd.set('body', 'Hello')

      await expect(logCommunicationAction(fd)).rejects.toThrow('NOT_FOUND')
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT id FROM clients WHERE id = \$1 AND organization_id = \$2/i),
        ['client-belongs-to-org-b', orgA]
      )
    })

    it('CRITICAL 2: createProjectAction rejects creating project referencing Org B client', async () => {
      vi.mocked(db.queryOne).mockResolvedValue(null)

      const fd = new FormData()
      fd.set('client_id', 'client-belongs-to-org-b')
      fd.set('title', 'Secret Project')

      await expect(createProjectAction(fd)).rejects.toThrow('NOT_FOUND')
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT id FROM clients WHERE id = \$1 AND organization_id = \$2/i),
        ['client-belongs-to-org-b', orgA]
      )
    })

    it('CRITICAL 3: createDeliverableAction rejects deliverable referencing Org B project', async () => {
      vi.mocked(db.queryOne).mockResolvedValue(null)

      const fd = new FormData()
      fd.set('title', 'Final Mockups')

      await expect(
        createDeliverableAction('project-belongs-to-org-b', fd)
      ).rejects.toThrow('NOT_FOUND')
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT id FROM projects WHERE id = \$1 AND organization_id = \$2/i),
        ['project-belongs-to-org-b', orgA]
      )
    })

    it('CRITICAL 4: createProjectTaskAction rejects task referencing Org B project', async () => {
      vi.mocked(db.queryOne).mockResolvedValue(null)

      const fd = new FormData()
      fd.set('title', 'QA Bug Fix')

      await expect(
        createProjectTaskAction('project-belongs-to-org-b', fd)
      ).rejects.toThrow('NOT_FOUND')
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT id FROM projects WHERE id = \$1 AND organization_id = \$2/i),
        ['project-belongs-to-org-b', orgA]
      )
    })

    it('CRITICAL 5: createGlobalTaskAction rejects global task referencing Org B project', async () => {
      vi.mocked(db.queryOne).mockResolvedValue(null)

      const fd = new FormData()
      fd.set('title', 'Database Migration Task')
      fd.set('project_id', 'project-belongs-to-org-b')

      await expect(createGlobalTaskAction(fd)).rejects.toThrow('NOT_FOUND')
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT id FROM projects WHERE id = \$1 AND organization_id = \$2/i),
        ['project-belongs-to-org-b', orgA]
      )
    })

    it('CRITICAL 6: createExtractedTaskAction rejects extracted task referencing Org B project', async () => {
      vi.mocked(db.queryOne).mockResolvedValue(null)

      await expect(
        createExtractedTaskAction({
          projectId: 'project-belongs-to-org-b',
          title: 'Follow up on review notes',
        })
      ).rejects.toThrow('NOT_FOUND')
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT id FROM projects WHERE id = \$1 AND organization_id = \$2/i),
        ['project-belongs-to-org-b', orgA]
      )
    })
  })

  // --------------------------------------------------------------------------
  // 3. OWNER/ADMIN RESTRICTED FUNCTIONS (Members, Viewers, Billing rejected)
  // --------------------------------------------------------------------------
  describe('3. HIGH: Owner/Admin Only Privileged Actions', () => {
    const disallowedRoles = ['member', 'viewer', 'billing_manager'] as const

    for (const role of disallowedRoles) {
      it(`rejects createProjectTemplateAction for role "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        const fd = new FormData()
        fd.set('name', 'Pro Template')
        await expect(createProjectTemplateAction(fd)).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects saveProjectAsTemplateAction for role "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(
          saveProjectAsTemplateAction('proj-123', 'Saved Template')
        ).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects deleteDeliverableAction for role "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(
          deleteDeliverableAction('deliv-123', 'proj-123')
        ).rejects.toThrow('INSUFFICIENT_ROLE')
      })
    }
  })

  // --------------------------------------------------------------------------
  // 4. VIEWER & BILLING_MANAGER REJECTION ON CONTRIBUTOR ACTIONS
  // --------------------------------------------------------------------------
  describe('4. HIGH: Viewer & Billing Manager Role Guard Rejections', () => {
    const unprivilegedRoles = ['viewer', 'billing_manager'] as const

    for (const role of unprivilegedRoles) {
      it(`rejects createClientAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        const fd = new FormData()
        fd.set('name', 'Client X')
        await expect(createClientAction(fd)).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects updateClientAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        const fd = new FormData()
        fd.set('name', 'Client Updated')
        await expect(updateClientAction('client-1', fd)).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects updateClientNotesAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(updateClientNotesAction('client-1', 'Notes')).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects createTagAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(createTagAction('VIP Client')).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects updateClientTagsAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(updateClientTagsAction('client-1', ['VIP'])).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects createProjectAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        const fd = new FormData()
        fd.set('title', 'Project New')
        fd.set('client_id', 'client-1')
        await expect(createProjectAction(fd)).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects updateProjectAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        const fd = new FormData()
        fd.set('title', 'Project Edited')
        await expect(updateProjectAction('proj-1', fd)).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects updateProjectStatusAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(updateProjectStatusAction('proj-1', 'Delivered')).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects createDeliverableAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        const fd = new FormData()
        fd.set('title', 'Wireframes')
        await expect(createDeliverableAction('proj-1', fd)).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects updateDeliverableStatusAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(
          updateDeliverableStatusAction('deliv-1', 'proj-1', 'approved')
        ).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects createProjectTaskAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        const fd = new FormData()
        fd.set('title', 'Design Header')
        await expect(createProjectTaskAction('proj-1', fd)).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects updateTaskStatusAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(updateTaskStatusAction('task-1', 'proj-1', 'done')).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects updateProjectTeamAssigneeAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(
          updateProjectTeamAssigneeAction('proj-1', 'usr-2')
        ).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects createGlobalTaskAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        const fd = new FormData()
        fd.set('title', 'Task 1')
        fd.set('project_id', 'proj-1')
        await expect(createGlobalTaskAction(fd)).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects updateGlobalTaskAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        const fd = new FormData()
        fd.set('title', 'Updated Task')
        await expect(updateGlobalTaskAction('task-1', fd)).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects toggleGlobalTaskStatusAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(toggleGlobalTaskStatusAction('task-1', 'done')).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects assignMessageClientAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(assignMessageClientAction('msg-1', 'client-1')).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects sendOutboundMessageAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        const fd = new FormData()
        fd.set('channel_id', 'chan-1')
        fd.set('body', 'Hello')
        await expect(sendOutboundMessageAction(fd)).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects generateReplySuggestionsAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(
          generateReplySuggestionsAction({
            channelId: 'chan-1',
            messages: [{ body: 'Hi', direction: 'inbound', sent_at: new Date().toISOString() }],
          })
        ).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects extractTasksFromThreadAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(
          extractTasksFromThreadAction({ messageBody: 'Please update the footer link' })
        ).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects createExtractedTaskAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(
          createExtractedTaskAction({ projectId: 'proj-1', title: 'Extracted Task' })
        ).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects updateLeadStageAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(updateLeadStageAction('lead-1', 'qualified')).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects createLeadAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        const fd = new FormData()
        fd.set('name', 'Hot Lead')
        await expect(createLeadAction(fd)).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects scoreLeadAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(scoreLeadAction('lead-1')).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects batchScoreLeadsAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(batchScoreLeadsAction()).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects generateWeeklyReportAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(generateWeeklyReportAction()).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects sendWeeklyReportAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(
          sendWeeklyReportAction({ recipientEmails: ['client@acme.com'], narrative: 'Report' })
        ).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects testAICompletionAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(testAICompletionAction('test')).rejects.toThrow('INSUFFICIENT_ROLE')
      })

      it(`rejects generateAnalyticsNarrativeAction for "${role}"`, async () => {
        vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
          user: userAlpha,
          organization: { id: orgA, name: 'Tenant Alpha' },
          role,
          isSuperAdmin: false,
        } as any)

        await expect(generateAnalyticsNarrativeAction('30d')).rejects.toThrow('INSUFFICIENT_ROLE')
      })
    }
  })

  // --------------------------------------------------------------------------
  // 5. LEGITIMATE CALLER SUCCEEDS
  // --------------------------------------------------------------------------
  describe('5. Legitimate Authorized Callers Succeed', () => {
    it('allows owner or admin to create project templates', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: userAlpha,
        organization: { id: orgA, name: 'Tenant Alpha Corp' },
        role: 'owner',
        isSuperAdmin: false,
      } as any)
      vi.mocked(db.queryOne).mockResolvedValue({ id: 'template-new-123' })

      const fd = new FormData()
      fd.set('name', 'Standard Design Sprint')
      const result = await createProjectTemplateAction(fd)
      expect(result.success).toBe(true)
      expect(result.templateId).toBe('template-new-123')
    })

    it('allows member to create a client within their organization', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: userAlpha,
        organization: { id: orgA, name: 'Tenant Alpha Corp' },
        role: 'member',
        isSuperAdmin: false,
      } as any)

      const fd = new FormData()
      fd.set('name', 'Legitimate Client Inc')
      fd.set('communication_mode', 'manual')
      fd.set('platform', 'WhatsApp')

      const result = await createClientAction(fd)
      expect(result.success).toBe(true)
      expect(result.clientId).toBe('mock-inserted-id')
    })

    it('allows member to create a project when parent client belongs to org', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: userAlpha,
        organization: { id: orgA, name: 'Tenant Alpha Corp' },
        role: 'member',
        isSuperAdmin: false,
      } as any)

      // Parent client verified in Org A
      vi.mocked(db.queryOne).mockResolvedValue({ id: 'client-in-org-a' })

      const fd = new FormData()
      fd.set('client_id', 'client-in-org-a')
      fd.set('title', 'Website Revamp')

      const result = await createProjectAction(fd)
      expect(result.success).toBe(true)
      expect(result.projectId).toBe('mock-inserted-id')
    })

    it('allows member to create a deliverable when parent project belongs to org', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: userAlpha,
        organization: { id: orgA, name: 'Tenant Alpha Corp' },
        role: 'member',
        isSuperAdmin: false,
      } as any)

      // Parent project verified in Org A, then deliverable inserted
      vi.mocked(db.queryOne)
        .mockResolvedValueOnce({ id: 'project-in-org-a' }) // parent check
        .mockResolvedValueOnce({ id: 'deliverable-uuid-1' }) // insert RETURNING id

      const fd = new FormData()
      fd.set('title', 'Brand Assets ZIP')

      const result = await createDeliverableAction('project-in-org-a', fd)
      expect(result.success).toBe(true)
      expect(result.deliverableId).toBe('deliverable-uuid-1')
    })

    it('allows member to create a project task when parent project belongs to org', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: userAlpha,
        organization: { id: orgA, name: 'Tenant Alpha Corp' },
        role: 'member',
        isSuperAdmin: false,
      } as any)

      vi.mocked(db.queryOne)
        .mockResolvedValueOnce({ id: 'project-in-org-a' }) // parent check
        .mockResolvedValueOnce({ id: 'task-uuid-1' }) // insert RETURNING id

      const fd = new FormData()
      fd.set('title', 'Write Copy')

      const result = await createProjectTaskAction('project-in-org-a', fd)
      expect(result.success).toBe(true)
      expect(result.taskId).toBe('task-uuid-1')
    })

    it('allows member to create a global task when parent project belongs to org', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: userAlpha,
        organization: { id: orgA, name: 'Tenant Alpha Corp' },
        role: 'member',
        isSuperAdmin: false,
      } as any)

      vi.mocked(db.queryOne)
        .mockResolvedValueOnce({ id: 'project-in-org-a' }) // parent check
        .mockResolvedValueOnce({ id: 'global-task-uuid-1' }) // insert RETURNING id

      const fd = new FormData()
      fd.set('title', 'Global Audit Task')
      fd.set('project_id', 'project-in-org-a')

      const result = await createGlobalTaskAction(fd)
      expect(result.success).toBe(true)
      expect(result.taskId).toBe('global-task-uuid-1')
    })

    it('allows super-admin to bypass standard role restrictions', async () => {
      vi.mocked(sessionModule.getCurrentSessionContext).mockResolvedValue({
        user: { id: 'usr-super', email: 'super@innoventix.internal' },
        organization: { id: orgA, name: 'Tenant Alpha Corp' },
        role: 'viewer', // Low role, but super-admin flag is active
        isSuperAdmin: true,
      } as any)
      vi.mocked(db.queryOne).mockResolvedValue({ id: 'template-sa-1' })

      const fd = new FormData()
      fd.set('name', 'Super Admin Template')
      const result = await createProjectTemplateAction(fd)
      expect(result.success).toBe(true)
    })
  })
})
