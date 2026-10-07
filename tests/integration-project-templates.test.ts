import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/session', () => ({
  getCurrentSessionContext: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
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
import { query, queryOne } from '@/lib/db'
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
    ;(queryOne as any).mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO projects')) {
        return Promise.resolve({ id: 'new-project-uuid-999' })
      }
      if (sql.includes('project_templates')) {
        return Promise.resolve({
          id: mockTemplateId,
          name: 'Website Redesign Template',
          default_deliverables: ['Figma Wireframes', 'Production React Build', 'Client Sign-off Document'],
        })
      }
      return Promise.resolve(null)
    })

    ;(query as any).mockImplementation((sql: string) => {
      if (sql.includes('project_template_tasks')) {
        const rows = [
          { title: 'Kickoff & Discovery', description: 'Gather client assets', day_offset: 2, priority: 'high' },
          { title: 'UI Design Mockups', description: 'Design hero section', day_offset: 7, priority: 'medium' },
        ]
        return Promise.resolve(Object.assign(rows, { rows }))
      }
      return Promise.resolve(Object.assign([], { rows: [] }))
    })

    const formData = new FormData()
    formData.set('title', 'Brand Redesign 2026')
    formData.set('client_id', 'client-1')
    formData.set('start_date', '2026-10-01')
    formData.set('deadline', '2026-11-01')
    formData.set('template_id', mockTemplateId)

    const result = await createProjectAction(formData)

    expect(result.success).toBe(true)
    expect(result.projectId).toBe('new-project-uuid-999')

    // Verify task scaffolding: tasks inserted
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tasks'),
      expect.arrayContaining([
        mockOrgId,
        'new-project-uuid-999',
        'Kickoff & Discovery',
      ])
    )

    // Verify deliverable scaffolding: deliverables inserted
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO deliverables'),
      expect.arrayContaining([
        mockOrgId,
        'new-project-uuid-999',
        'Figma Wireframes',
      ])
    )

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
