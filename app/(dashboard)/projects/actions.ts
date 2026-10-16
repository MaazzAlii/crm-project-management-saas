'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { requireRole } from '@/lib/auth/server-guard'
import { query, queryOne, transaction } from '@/lib/db'
import { checkProjectLimit } from '@/lib/services/plan-limits'
import { logAuditEvent } from '@/lib/audit/logger'
import { emitAutomationEvent } from '@/lib/automation/emitter'
import { revalidatePath } from 'next/cache'

export interface ProjectRecord {
  id: string
  organization_id: string
  client_id: string
  client_name?: string
  client_company?: string | null
  title: string
  description?: string | null
  type?: string | null
  brief_source?: string | null
  amount: number
  currency: string
  status: string
  priority: string
  start_date?: string | null
  deadline?: string | null
  assigned_to?: string | null
  assigned_name?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export async function fetchProjectsAction(): Promise<ProjectRecord[]> {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.organization) {
      return []
    }

    let projects: ProjectRecord[] = []

    try {
      const res = await query<any>(
        `SELECT p.*,
                c.name as client_name, c.company as client_company,
                u.full_name as assigned_name, u.email as assigned_email
         FROM projects p
         LEFT JOIN clients c ON c.id = p.client_id
         LEFT JOIN users u ON u.id = p.assigned_to
         WHERE p.organization_id = $1
         ORDER BY p.created_at DESC`,
        [session.organization.id]
      )

      if (res.rows) {
        projects = res.rows.map((item: any) => ({
          id: item.id,
          organization_id: item.organization_id,
          client_id: item.client_id,
          client_name: item.client_name || 'Unknown Client',
          client_company: item.client_company || null,
          title: item.title,
          description: item.description,
          type: item.type,
          brief_source: item.brief_source,
          amount: parseFloat(item.amount || '0'),
          currency: item.currency || 'USD',
          status: item.status || 'Active',
          priority: item.priority || 'medium',
          start_date: item.start_date,
          deadline: item.deadline,
          assigned_to: item.assigned_to,
          assigned_name: item.assigned_name || item.assigned_email || null,
          notes: item.notes,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }))
      }
    } catch (err) {
      console.error('Error querying projects:', err)
    }

    return projects
  } catch (err) {
    console.error('fetchProjectsAction error:', err)
    return []
  }
}

export type CreateProjectActionResult = {
  success: boolean;
  projectId?: string;
  error?: string;
  code?: string;
  currentCount?: number;
  limit?: number;
  planName?: string;
  upgradeUrl?: string;
};

export async function createProjectAction(formData: FormData): Promise<CreateProjectActionResult> {
  const session = await requireRole(['owner', 'admin', 'member'])

  const orgId = session.organization.id

  const clientId = formData.get('client_id')?.toString().trim()
  const title = formData.get('title')?.toString().trim()
  const description = formData.get('description')?.toString().trim() || null
  const type = formData.get('type')?.toString().trim() || 'Combined'
  const brief_source = formData.get('brief_source')?.toString().trim() || 'WhatsApp'
  const amount = parseFloat(formData.get('amount')?.toString() || '0')
  const currency = formData.get('currency')?.toString().trim() || 'USD'
  const status = formData.get('status')?.toString().trim() || 'Active'
  const priority = formData.get('priority')?.toString().trim() || 'medium'
  const start_date = formData.get('start_date')?.toString().trim() || null
  const deadline = formData.get('deadline')?.toString().trim() || null
  const assigned_to = formData.get('assigned_to')?.toString().trim() || null
  const notes = formData.get('notes')?.toString().trim() || null
  const template_id = formData.get('template_id')?.toString().trim() || null

  if (!clientId) {
    return { success: false, error: 'Client selection is required for a project.' }
  }

  if (!title) {
    return { success: false, error: 'Project title is required.' }
  }

  // Cross-tenant parent resource verification: client must belong to caller's org
  const parent = await queryOne<{ id: string }>(
    'SELECT id FROM clients WHERE id = $1 AND organization_id = $2',
    [clientId, orgId]
  )
  if (!parent) {
    throw new Error('NOT_FOUND')
  }

  try {
    // Atomic server-side Plan Limit Check & Insertion with row lock
    const txResult = await transaction(async (client) => {
      await client.query('SELECT id FROM organizations WHERE id = $1 FOR UPDATE', [orgId]);

      const limitCheck = await checkProjectLimit(orgId, { client });
      if (!limitCheck.allowed) {
        return {
          limitError: {
            error: limitCheck.message || `You've reached your plan's project limit (${limitCheck.limit} projects). Please upgrade your plan to add more projects.`,
            code: 'PROJECT_LIMIT_REACHED',
            currentCount: limitCheck.currentCount,
            limit: limitCheck.limit,
            planName: limitCheck.planName,
            upgradeUrl: limitCheck.upgradeUrl,
          },
          newProject: null,
        };
      }

      const insertRes = await client.query<{ id: string }>(
        `INSERT INTO projects (
           organization_id, client_id, title, description, type, brief_source,
           amount, currency, status, priority, start_date, deadline, assigned_to, notes
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id`,
        [
          orgId,
          clientId,
          title,
          description,
          type,
          brief_source,
          amount,
          currency,
          status,
          priority,
          start_date,
          deadline,
          assigned_to || null,
          notes,
        ]
      );

      return { limitError: null, newProject: insertRes.rows[0] };
    });

    if (txResult.limitError) {
      return {
        success: false,
        error: txResult.limitError.error,
        code: txResult.limitError.code,
        currentCount: txResult.limitError.currentCount,
        limit: txResult.limitError.limit,
        planName: txResult.limitError.planName,
        upgradeUrl: txResult.limitError.upgradeUrl,
      };
    }

    const newProject = txResult.newProject;
    if (!newProject) {
      return { success: false, error: 'Database error occurred while creating project.' };
    }

      // Scaffold tasks and deliverables if template_id is provided
      if (newProject && template_id) {
        try {
          const orgId = session.organization.id
          const template = await queryOne<any>(
            `SELECT * FROM project_templates WHERE id = $1 AND organization_id = $2`,
            [template_id, orgId]
          )
          const templateTasksRes = await query<any>(
            `SELECT * FROM project_template_tasks WHERE template_id = $1 AND organization_id = $2`,
            [template_id, orgId]
          )
          const templateTasks = templateTasksRes.rows || []

          const baseStartDate = start_date ? new Date(start_date) : new Date()

          // Scaffold Tasks
          if (templateTasks && templateTasks.length > 0) {
            for (const tt of templateTasks) {
              const taskDueDate = new Date(baseStartDate)
              taskDueDate.setDate(taskDueDate.getDate() + (tt.day_offset || 0))

              await query(
                `INSERT INTO tasks (
                   organization_id, project_id, title, description, priority, status, due_date, assigned_to
                 ) VALUES ($1, $2, $3, $4, $5, 'todo', $6, $7)`,
                [
                  orgId,
                  newProject.id,
                  tt.title,
                  tt.description || null,
                  tt.priority || 'medium',
                  taskDueDate.toISOString().slice(0, 10),
                  assigned_to || null,
                ]
              )
            }
          }

          // Scaffold Deliverables
          const deliverablesList: string[] = Array.isArray(template?.default_deliverables)
            ? template.default_deliverables
            : typeof template?.default_deliverables === 'string'
            ? JSON.parse(template.default_deliverables || '[]')
            : []

          if (deliverablesList.length > 0) {
            for (const delTitle of deliverablesList) {
              await query(
                `INSERT INTO deliverables (
                   organization_id, project_id, title, status, submitted_at
                 ) VALUES ($1, $2, $3, 'pending', NOW())`,
                [orgId, newProject.id, delTitle]
              )
            }
          }
        } catch (scaffoldErr) {
          console.error('Template scaffolding error:', scaffoldErr)
        }
      }

    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'PROJECT_CREATED',
        targetType: 'project',
        targetId: newProject.id,
        details: {
          title,
          status,
          clientId,
          organizationId: session.organization.id,
        },
      })
    } catch (e) {}

    revalidatePath('/projects')
    revalidatePath(`/clients/${clientId}`)
    return { success: true, projectId: newProject.id }
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED' || error.message === 'INSUFFICIENT_ROLE' || error.message === 'NOT_FOUND') {
      throw error
    }
    console.error('createProjectAction error:', error)
    return { success: false, error: error?.message || 'Internal server error.' }
  }
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const session = await requireRole(['owner', 'admin', 'member'])

  try {
    const title = formData.get('title')?.toString().trim()
    const description = formData.get('description')?.toString().trim() || null
    const type = formData.get('type')?.toString().trim() || 'Combined'
    const amount = parseFloat(formData.get('amount')?.toString() || '0')
    const currency = formData.get('currency')?.toString().trim() || 'USD'
    const status = formData.get('status')?.toString().trim() || 'Active'
    const priority = formData.get('priority')?.toString().trim() || 'medium'
    const start_date = formData.get('start_date')?.toString().trim() || null
    const deadline = formData.get('deadline')?.toString().trim() || null
    const assigned_to = formData.get('assigned_to')?.toString().trim() || null
    const notes = formData.get('notes')?.toString().trim() || null

    if (!title) {
      return { error: 'Project title is required.' }
    }

    const updatePayload = {
      title,
      description,
      type,
      amount,
      currency,
      status,
      priority,
      start_date,
      deadline,
      assigned_to: assigned_to || null,
      notes,
      updated_at: new Date().toISOString(),
    }

    try {
      await query(
        `UPDATE projects
         SET title = $1, description = $2, type = $3, amount = $4, currency = $5,
             status = $6, priority = $7, start_date = $8, deadline = $9,
             assigned_to = $10, notes = $11, updated_at = NOW()
         WHERE id = $12 AND organization_id = $13`,
        [
          title,
          description,
          type,
          amount,
          currency,
          status,
          priority,
          start_date,
          deadline,
          assigned_to || null,
          notes,
          projectId,
          session.organization.id,
        ]
      )
    } catch (err: any) {
      console.error('Failed to update project:', err)
      return { error: err?.message || 'Database error occurred while updating project.' }
    }

    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'PROJECT_UPDATED',
        targetType: 'project',
        targetId: projectId,
        details: { title, status, organizationId: session.organization.id },
      })
    } catch (e) {}

    revalidatePath('/projects')
    return { success: true }
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED' || error.message === 'INSUFFICIENT_ROLE' || error.message === 'NOT_FOUND') {
      throw error
    }
    return { error: error?.message || 'Failed to update project.' }
  }
}

export async function updateProjectStatusAction(projectId: string, newStatus: string) {
  const session = await requireRole(['owner', 'admin', 'member'])

  try {
    // 1. Fetch current project and client info
    let project: any = null
    try {
      project = await queryOne<any>(
        `SELECT p.*,
                c.id as client_id, c.name as client_name, c.email as client_email,
                c.payment_schedule, c.currency as client_currency
         FROM projects p
         LEFT JOIN clients c ON c.id = p.client_id
         WHERE p.id = $1 AND p.organization_id = $2`,
        [projectId, session.organization.id]
      )
    } catch (err) {}

    const normalizedStatus = newStatus.toLowerCase().replace(/ /g, '_')
    const updatePayload: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    let invoiceTriggered = false
    if (normalizedStatus === 'delivered') {
      updatePayload.delivered_at = new Date().toISOString()

      // Decision branch per spec: check payment_schedule (per_project vs recurring)
      const schedule = (project?.client_payment_schedule || project?.payment_schedule || 'Per Project').toLowerCase()
      const isPerProject = schedule.includes('per project') || schedule.includes('per_project')

      if (isPerProject) {
        updatePayload.invoice_triggered = true
        invoiceTriggered = true

        // Outbound signed event emitter
        try {
          await emitAutomationEvent({
            organizationId: session.organization.id,
            event: 'project.delivered',
            data: {
              project_id: projectId,
              project_name: project?.title || 'Project',
              client_id: project?.client_id,
              client_name: project?.client_name || 'Client',
              client_email: project?.client_email || null,
              budget: Number(project?.amount) || 0,
              delivered_at: updatePayload.delivered_at,
              completed_by_id: session.user.id,
              completed_by_name: session.user.email,
              completed_by_email: session.user.email,
            },
          })
        } catch (eventErr) {
          console.warn('[Automation] Error emitting project.delivered event:', eventErr)
        }

        try {
          await logAuditEvent({
            actorId: session.user.id,
            action: 'PROJECT_DELIVERED_INVOICE_TRIGGERED',
            targetType: 'project',
            targetId: projectId,
            details: {
              organizationId: session.organization.id,
              amount: project?.amount,
              paymentSchedule: project?.client_payment_schedule || project?.payment_schedule || 'Per Project',
            },
          })
        } catch (auditErr) {}
      }
    }

    try {
      await query(
        `UPDATE projects
         SET status = $1, invoice_triggered = $2, delivered_at = $3, updated_at = NOW()
         WHERE id = $4 AND organization_id = $5`,
        [
          newStatus,
          updatePayload.invoice_triggered || false,
          updatePayload.delivered_at || null,
          projectId,
          session.organization.id,
        ]
      )
    } catch (err) {}

    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'PROJECT_STATUS_UPDATED',
        targetType: 'project',
        targetId: projectId,
        details: {
          newStatus,
          previousStatus: project?.status,
          organizationId: session.organization.id,
        },
      })
    } catch (e) {}

    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)
    return { success: true, invoiceTriggered }
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED' || error.message === 'INSUFFICIENT_ROLE' || error.message === 'NOT_FOUND') {
      throw error
    }
    return { error: error?.message || 'Failed to update project status.' }
  }
}

export async function deleteProjectAction(projectId: string) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

    const canDelete = session.role === 'owner' || session.role === 'admin' || session.isSuperAdmin
    if (!canDelete) {
      return { error: 'Forbidden. Only organization owners and admins can delete projects.' }
    }

    try {
      await query(
        `DELETE FROM projects WHERE id = $1 AND organization_id = $2`,
        [projectId, session.organization.id]
      )
    } catch (err) {}

    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'PROJECT_DELETED',
        targetType: 'project',
        targetId: projectId,
        details: { organizationId: session.organization.id },
      })
    } catch (e) {}

    revalidatePath('/projects')
    return { success: true }
  } catch (error: any) {
    return { error: error?.message || 'Failed to delete project.' }
  }
}

// Deliverables, Tasks & Activity Log Interfaces
export interface DeliverableRecord {
  id: string
  organization_id: string
  project_id: string
  title: string
  file_url?: string | null
  drive_link?: string | null
  status: 'pending' | 'approved' | 'revision_required'
  client_feedback?: string | null
  submitted_at?: string
  created_at: string
  updated_at: string
}

export interface TaskRecord {
  id: string
  organization_id: string
  project_id: string
  title: string
  description?: string | null
  assigned_to?: string | null
  assigned_name?: string | null
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string | null
  completed_at?: string | null
  created_at: string
}

export interface ProjectActivityLogRecord {
  id: string
  organization_id: string
  project_id: string
  actor_id?: string | null
  actor_name?: string | null
  action: string
  details?: any
  created_at: string
}

// Helper to log project activity
export async function logProjectActivity(
  projectId: string,
  action: string,
  details: any = {}
) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) return

    await query(
      `INSERT INTO project_activity_log (organization_id, project_id, actor_id, actor_name, action, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        session.organization.id,
        projectId,
        session.user?.id || null,
        session.user?.full_name || session.user?.email || 'System User',
        action,
        JSON.stringify(details)
      ]
    )
  } catch (e) {}
}

// Fetch single project detail with client & assigned profile
export async function fetchProjectDetailAction(projectId: string): Promise<ProjectRecord | null> {
  try {
    const session = await getCurrentSessionContext()

    if (session && session.organization) {
      const data = await queryOne<any>(
        `SELECT p.*,
                c.name AS client_name,
                c.company AS client_company,
                u.full_name AS assigned_name,
                u.email AS assigned_email
         FROM projects p
         LEFT JOIN clients c ON c.id = p.client_id
         LEFT JOIN users u ON u.id = p.assigned_to
         WHERE p.id = $1 AND p.organization_id = $2`,
        [projectId, session.organization.id]
      )

      if (data) {
        return {
          id: data.id,
          organization_id: data.organization_id,
          client_id: data.client_id,
          client_name: data.client_name || 'Client',
          client_company: data.client_company || null,
          title: data.title,
          description: data.description,
          type: data.type,
          brief_source: data.brief_source,
          amount: parseFloat(data.amount || '0'),
          currency: data.currency || 'USD',
          status: data.status || 'Planning',
          priority: data.priority || 'medium',
          start_date: data.start_date,
          deadline: data.deadline,
          assigned_to: data.assigned_to,
          assigned_name: data.assigned_name || data.assigned_email || null,
          notes: data.notes,
          created_at: data.created_at,
          updated_at: data.updated_at
        }
      }
    }

    return null
  } catch (err) {
    console.error('fetchProjectDetailAction error:', err)
    return null
  }
}

// Fetch deliverables for a project
export async function fetchProjectDeliverablesAction(projectId: string): Promise<DeliverableRecord[]> {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) return []

    const data = await query<DeliverableRecord>(
      `SELECT * FROM deliverables WHERE project_id = $1 AND organization_id = $2 ORDER BY created_at DESC`,
      [projectId, session.organization.id]
    )

    return data || []
  } catch (err) {
    return []
  }
}

// Create deliverable action
export async function createDeliverableAction(projectId: string, formData: FormData) {
  const session = await requireRole(['owner', 'admin', 'member'])

  // Cross-tenant parent resource verification: project must belong to caller's org
  const parent = await queryOne<{ id: string }>(
    'SELECT id FROM projects WHERE id = $1 AND organization_id = $2',
    [projectId, session.organization.id]
  )
  if (!parent) {
    throw new Error('NOT_FOUND')
  }

  try {
    const title = formData.get('title')?.toString().trim()
    const file_url = formData.get('file_url')?.toString().trim() || null
    const drive_link = formData.get('drive_link')?.toString().trim() || null

    if (!title) return { error: 'Deliverable title is required.' }

    const data = await queryOne<{ id: string }>(
      `INSERT INTO deliverables (organization_id, project_id, title, file_url, drive_link, status, submitted_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
       RETURNING id`,
      [session.organization.id, projectId, title, file_url, drive_link]
    )

    if (!data) {
      return { error: 'Failed to create deliverable.' }
    }

    await logProjectActivity(projectId, 'DELIVERABLE_CREATED', { title })
    try {
      if (session?.user) {
        await logAuditEvent({
          actorId: session.user.id,
          organizationId: session.organization.id,
          action: 'DELIVERABLE_CREATED',
          targetType: 'deliverable',
          targetId: data.id,
          details: { title, projectId },
        })
      }
    } catch (e) {}

    revalidatePath(`/projects/${projectId}`)
    return { success: true, deliverableId: data.id }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    return { error: err.message || 'Failed to create deliverable.' }
  }
}

// Update deliverable review status (pending/approved/revision_required)
export async function updateDeliverableStatusAction(
  deliverableId: string,
  projectId: string,
  status: 'pending' | 'approved' | 'revision_required',
  clientFeedback?: string
) {
  const session = await requireRole(['owner', 'admin', 'member'])

  try {

    await query(
      `UPDATE deliverables
       SET status = $1, client_feedback = $2, updated_at = NOW()
       WHERE id = $3 AND organization_id = $4`,
      [status, clientFeedback || null, deliverableId, session.organization.id]
    )

    await logProjectActivity(projectId, 'DELIVERABLE_STATUS_UPDATED', {
      deliverableId,
      status,
      clientFeedback
    })

    try {
      if (session?.user) {
        await logAuditEvent({
          actorId: session.user.id,
          organizationId: session.organization.id,
          action: 'DELIVERABLE_STATUS_UPDATED',
          targetType: 'deliverable',
          targetId: deliverableId,
          details: { status, projectId, clientFeedback },
        })
      }
    } catch (e) {}

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    return { error: err.message || 'Failed to update deliverable status.' }
  }
}

// Delete deliverable
export async function deleteDeliverableAction(deliverableId: string, projectId: string) {
  const session = await requireRole(['owner', 'admin'])

  try {

    await query(
      `DELETE FROM deliverables WHERE id = $1 AND organization_id = $2`,
      [deliverableId, session.organization.id]
    )

    await logProjectActivity(projectId, 'DELIVERABLE_DELETED', { deliverableId })

    try {
      if (session?.user) {
        await logAuditEvent({
          actorId: session.user.id,
          organizationId: session.organization.id,
          action: 'DELIVERABLE_DELETED',
          targetType: 'deliverable',
          targetId: deliverableId,
          details: { projectId },
        })
      }
    } catch (e) {}

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    return { error: err.message || 'Failed to delete deliverable.' }
  }
}

// Fetch project tasks
export async function fetchProjectTasksAction(projectId: string): Promise<TaskRecord[]> {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) return []

    const data = await query<any>(
      `SELECT t.*, u.full_name AS assigned_name, u.email AS assigned_email
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.project_id = $1 AND t.organization_id = $2
       ORDER BY t.created_at ASC`,
      [projectId, session.organization.id]
    )

    if (data && data.length > 0) {
      return data.map((t) => ({
        id: t.id,
        organization_id: t.organization_id,
        project_id: t.project_id,
        title: t.title,
        description: t.description,
        assigned_to: t.assigned_to,
        assigned_name: t.assigned_name || t.assigned_email || null,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        completed_at: t.completed_at,
        created_at: t.created_at
      }))
    }

    return []
  } catch (err) {
    return []
  }
}

// Create task action
export async function createProjectTaskAction(projectId: string, formData: FormData) {
  const session = await requireRole(['owner', 'admin', 'member'])

  // Cross-tenant parent resource verification: project must belong to caller's org
  const parent = await queryOne<{ id: string }>(
    'SELECT id FROM projects WHERE id = $1 AND organization_id = $2',
    [projectId, session.organization.id]
  )
  if (!parent) {
    throw new Error('NOT_FOUND')
  }

  try {
    const title = formData.get('title')?.toString().trim()
    const description = formData.get('description')?.toString().trim() || null
    const priority = (formData.get('priority')?.toString().trim() || 'medium') as any
    const due_date = formData.get('due_date')?.toString().trim() || null
    const assigned_to = formData.get('assigned_to')?.toString().trim() || null

    if (!title) return { error: 'Task title is required.' }

    const data = await queryOne<{ id: string }>(
      `INSERT INTO tasks (organization_id, project_id, title, description, priority, status, due_date, assigned_to)
       VALUES ($1, $2, $3, $4, $5, 'todo', $6, $7)
       RETURNING id`,
      [session.organization.id, projectId, title, description, priority, due_date, assigned_to || null]
    )

    if (!data) return { error: 'Failed to create task.' }

    await logProjectActivity(projectId, 'TASK_CREATED', { title })
    revalidatePath(`/projects/${projectId}`)
    return { success: true, taskId: data.id }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    return { error: err.message || 'Failed to create task.' }
  }
}

// Update task status
export async function updateTaskStatusAction(
  taskId: string,
  projectId: string,
  newStatus: 'todo' | 'in_progress' | 'review' | 'done'
) {
  const session = await requireRole(['owner', 'admin', 'member'])

  try {

    if (newStatus === 'done') {
      await query(
        `UPDATE tasks SET status = $1, completed_at = NOW(), updated_at = NOW()
         WHERE id = $2 AND organization_id = $3`,
        [newStatus, taskId, session.organization.id]
      )
    } else {
      await query(
        `UPDATE tasks SET status = $1, updated_at = NOW()
         WHERE id = $2 AND organization_id = $3`,
        [newStatus, taskId, session.organization.id]
      )
    }

    await logProjectActivity(projectId, 'TASK_STATUS_UPDATED', { taskId, newStatus })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    return { error: err.message || 'Failed to update task status.' }
  }
}

// Update project team assignee
export async function updateProjectTeamAssigneeAction(projectId: string, assignedToId: string | null) {
  const session = await requireRole(['owner', 'admin', 'member'])

  try {

    await query(
      `UPDATE projects SET assigned_to = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3`,
      [assignedToId || null, projectId, session.organization.id]
    )

    await logProjectActivity(projectId, 'PROJECT_ASSIGNEE_UPDATED', { assignedToId })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    return { error: err.message || 'Failed to update team assignee.' }
  }
}

// Fetch activity log for project
export async function fetchProjectActivityLogAction(projectId: string): Promise<ProjectActivityLogRecord[]> {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) return []

    const data = await query<ProjectActivityLogRecord>(
      `SELECT * FROM project_activity_log WHERE project_id = $1 AND organization_id = $2 ORDER BY created_at DESC`,
      [projectId, session.organization.id]
    )

    return data || []
  } catch (err) {
    return []
  }
}

