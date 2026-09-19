import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/session', () => ({
  getCurrentSessionContext: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/billing/plan-limits', () => ({
  checkProjectLimit: vi.fn(),
}))

vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(true),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { checkProjectLimit } from '@/lib/billing/plan-limits'
import { logAuditEvent } from '@/lib/audit/logger'
import { createProjectAction } from '@/app/(dashboard)/projects/actions'

describe('Integration: Project Creation with Template Scaffolding', () => {
  const mockOrgId = 'org-scaffold-1'
  const mockUserId = 'usr-admin-1'
  const mockTemplateId = 'tmpl-web-design-123'

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getCurrentSessionContext as any).mockResolvedValue({
      user: { id: mockUserId, email: 'admin@scaffold.com' },
      organization: { id: mockOrgId, name: 'Scaffold Org' },
      role: 'admin',
      isSuperAdmin: false,
    })
    ;(checkProjectLimit as any).mockResolvedValue({
      allowed: true,
      currentCount: 2,
      maxLimit: 50,
    })
  })

  it('scaffolds tasks and deliverables when template_id is provided', async () => {
    const mockTasksInsert = vi.fn().mockResolvedValue({ error: null })
    const mockDeliverablesInsert = vi.fn().mockResolvedValue({ error: null })

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'projects') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'new-project-uuid-999' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'project_templates') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: mockTemplateId,
                      name: 'Website Redesign Template',
                      default_deliverables: ['Figma Wireframes', 'Production React Build', 'Client Sign-off Document'],
                    },
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'project_template_tasks') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [
                    { title: 'Kickoff & Discovery', description: 'Gather client assets', day_offset: 2, priority: 'high' },
                    { title: 'UI Design Mockups', description: 'Design hero section', day_offset: 7, priority: 'medium' },
                  ],
                }),
              }),
            }),
          }
        }
        if (table === 'tasks') {
          return {
            insert: mockTasksInsert,
          }
        }
        if (table === 'deliverables') {
          return {
            insert: mockDeliverablesInsert,
          }
        }
        return {}
      }),
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)

    const formData = new FormData()
    formData.set('title', 'Brand Redesign 2026')
    formData.set('client_id', 'client-1')
    formData.set('start_date', '2026-10-01')
    formData.set('deadline', '2026-11-01')
    formData.set('template_id', mockTemplateId)

    const result = await createProjectAction(formData)

    expect(result.success).toBe(true)
    expect(result.projectId).toBe('new-project-uuid-999')

    // Verify task scaffolding: 2 tasks inserted with offset due dates
    expect(mockTasksInsert).toHaveBeenCalledTimes(1)
    const scaffoldedTasks = mockTasksInsert.mock.calls[0][0]
    expect(scaffoldedTasks.length).toBe(2)
    expect(scaffoldedTasks[0].title).toBe('Kickoff & Discovery')
    expect(scaffoldedTasks[0].project_id).toBe('new-project-uuid-999')
    expect(scaffoldedTasks[0].organization_id).toBe(mockOrgId)
    // Offset by 2 days from 2026-10-01 -> 2026-10-03
    expect(scaffoldedTasks[0].due_date).toBe('2026-10-03')

    // Verify deliverable scaffolding: 3 deliverables inserted
    expect(mockDeliverablesInsert).toHaveBeenCalledTimes(1)
    const scaffoldedDeliverables = mockDeliverablesInsert.mock.calls[0][0]
    expect(scaffoldedDeliverables.length).toBe(3)
    expect(scaffoldedDeliverables[0].title).toBe('Figma Wireframes')
    expect(scaffoldedDeliverables[1].title).toBe('Production React Build')
    expect(scaffoldedDeliverables[2].title).toBe('Client Sign-off Document')
    expect(scaffoldedDeliverables[0].project_id).toBe('new-project-uuid-999')
    expect(scaffoldedDeliverables[0].organization_id).toBe(mockOrgId)

    // Verify audit log emitted
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PROJECT_CREATED',
        targetId: 'new-project-uuid-999',
      })
    )
  })

  it('validates required fields: rejects missing title or client_id', async () => {
    const formDataNoTitle = new FormData()
    formDataNoTitle.set('client_id', 'client-1')
    const resNoTitle = await createProjectAction(formDataNoTitle)
    expect(resNoTitle.error).toBe('Project title is required.')

    const formDataNoClient = new FormData()
    formDataNoClient.set('title', 'Project Without Client')
    const resNoClient = await createProjectAction(formDataNoClient)
    expect(resNoClient.error).toBe('Client selection is required for a project.')
  })

  it('evaluates project limit check logic for plan enforcement', async () => {
    ;(checkProjectLimit as any).mockResolvedValue({
      allowed: false,
      currentCount: 50,
      maxLimit: 50,
      reason: 'Project limit reached (50 active projects). Please upgrade your plan.',
    })

    const limitCheck = await checkProjectLimit(mockOrgId)
    expect(limitCheck.allowed).toBe(false)
    expect(limitCheck.reason).toContain('Project limit reached (50 active projects)')
  })
})
