'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { requireRole } from '@/lib/auth/server-guard'
import { query, queryOne } from '@/lib/db'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'

export interface GlobalTaskRecord {
  id: string
  organization_id: string
  project_id: string
  project_title?: string
  title: string
  description?: string | null
  assigned_to?: string | null
  assigned_name?: string | null
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string | null
  completed_at?: string | null
  created_at: string
  updated_at?: string
}

export interface TeamWorkloadRecord {
  id: string
  full_name: string
  email?: string | null
  active_tasks_count: number
  done_tasks_count: number
  overdue_tasks_count: number
  total_assigned_count: number
  workload_level: 'Light' | 'Optimal' | 'Heavy' | 'Overloaded'
  assigned_tasks: GlobalTaskRecord[]
}

// Fetch all tasks for an organization
export async function fetchAllTasksAction(): Promise<GlobalTaskRecord[]> {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.organization) {
      return []
    }

    const data = await query<any>(
      `SELECT t.*, p.title AS project_title, u.full_name AS assigned_name, u.email AS assigned_email
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.organization_id = $1
       ORDER BY t.due_date ASC NULLS LAST`,
      [session.organization.id]
    )

    if (!data || data.length === 0) {
      return []
    }

    return data.map((t) => ({
      id: t.id,
      organization_id: t.organization_id,
      project_id: t.project_id,
      project_title: t.project_title || 'Agency Project',
      title: t.title,
      description: t.description,
      assigned_to: t.assigned_to,
      assigned_name: t.assigned_name || t.assigned_email || null,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      completed_at: t.completed_at,
      created_at: t.created_at,
      updated_at: t.updated_at
    }))
  } catch (err) {
    console.error('fetchAllTasksAction error:', err)
    return []
  }
}

// Create new task
export async function createGlobalTaskAction(formData: FormData) {
  const session = await requireRole(['owner', 'admin', 'member'])

  const title = formData.get('title')?.toString().trim()
  const description = formData.get('description')?.toString().trim() || null
  const project_id = formData.get('project_id')?.toString().trim()
  const assigned_to = formData.get('assigned_to')?.toString().trim() || null
  const priority = (formData.get('priority')?.toString().trim() || 'medium') as any
  const status = (formData.get('status')?.toString().trim() || 'todo') as any
  const due_date = formData.get('due_date')?.toString().trim() || null

  if (!title) {
    return { error: 'Task title is required.' }
  }

  if (!project_id) {
    return { error: 'Please select a target project.' }
  }

  // Cross-tenant parent resource verification: project must belong to caller's org
  const parent = await queryOne<{ id: string }>(
    'SELECT id FROM projects WHERE id = $1 AND organization_id = $2',
    [project_id, session.organization.id]
  )
  if (!parent) {
    throw new Error('NOT_FOUND')
  }

  try {
    const data = await queryOne<{ id: string }>(
      `INSERT INTO tasks (
        organization_id, project_id, title, description, assigned_to,
        priority, status, due_date, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      ) RETURNING id`,
      [
        session.organization.id,
        project_id,
        title,
        description,
        assigned_to || null,
        priority,
        status,
        due_date
      ]
    )

    if (!data) {
      return { error: 'Database error creating task.' }
    }

    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'TASK_CREATED',
        targetType: 'task',
        targetId: data.id,
        details: { title, project_id, organizationId: session.organization.id }
      })
    } catch (e) {}

    revalidatePath('/tasks')
    revalidatePath(`/projects/${project_id}`)
    return { success: true, taskId: data.id }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    return { error: err.message || 'Failed to create task.' }
  }
}

// Update task action
export async function updateGlobalTaskAction(taskId: string, formData: FormData) {
  const session = await requireRole(['owner', 'admin', 'member'])

  try {

    const title = formData.get('title')?.toString().trim()
    const description = formData.get('description')?.toString().trim() || null
    const assigned_to = formData.get('assigned_to')?.toString().trim() || null
    const priority = (formData.get('priority')?.toString().trim() || 'medium') as any
    const status = (formData.get('status')?.toString().trim() || 'todo') as any
    const due_date = formData.get('due_date')?.toString().trim() || null

    if (!title) {
      return { error: 'Task title is required.' }
    }

    const completedAt = status === 'done' ? new Date().toISOString() : null

    await query(
      `UPDATE tasks
       SET title = $1, description = $2, assigned_to = $3, priority = $4, status = $5,
           due_date = $6, updated_at = NOW(), completed_at = $7
       WHERE id = $8 AND organization_id = $9`,
      [
        title,
        description,
        assigned_to || null,
        priority,
        status,
        due_date,
        completedAt,
        taskId,
        session.organization.id
      ]
    )

    try {
      await logAuditEvent({
        actorId: session.user.id,
        organizationId: session.organization.id,
        action: 'TASK_UPDATED',
        targetType: 'task',
        targetId: taskId,
        details: { title, status, priority, due_date },
      })
    } catch (e) {}

    revalidatePath('/tasks')
    return { success: true }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    return { error: err.message || 'Failed to update task.' }
  }
}

// Quick status toggle
export async function toggleGlobalTaskStatusAction(taskId: string, newStatus: 'todo' | 'in_progress' | 'review' | 'done') {
  const session = await requireRole(['owner', 'admin', 'member'])

  try {

    const completedAt = newStatus === 'done' ? new Date().toISOString() : null

    await query(
      `UPDATE tasks
       SET status = $1, updated_at = NOW(), completed_at = $2
       WHERE id = $3 AND organization_id = $4`,
      [newStatus, completedAt, taskId, session.organization.id]
    )

    try {
      await logAuditEvent({
        actorId: session.user.id,
        organizationId: session.organization.id,
        action: 'TASK_STATUS_CHANGED',
        targetType: 'task',
        targetId: taskId,
        details: { newStatus },
      })
    } catch (e) {}

    revalidatePath('/tasks')
    return { success: true }
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
    return { error: err.message || 'Failed to toggle status.' }
  }
}

// Delete task
export async function deleteGlobalTaskAction(taskId: string, confirmOrgName?: string) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

    if (session.impersonation?.isImpersonated) {
      const { assertDestructiveActionAllowed } = await import('@/lib/auth/impersonation')
      assertDestructiveActionAllowed(session, confirmOrgName)
    }

    const canDelete = session.role === 'owner' || session.role === 'admin' || session.isSuperAdmin
    if (!canDelete) {
      return { error: 'Forbidden. Only organization owners and admins can delete tasks.' }
    }

    await query(
      `DELETE FROM tasks WHERE id = $1 AND organization_id = $2`,
      [taskId, session.organization.id]
    )

    try {
      await logAuditEvent({
        actorId: session.user.id,
        organizationId: session.organization.id,
        action: 'TASK_DELETED',
        targetType: 'task',
        targetId: taskId,
        details: { organizationId: session.organization.id },
      })
    } catch (e) {}

    revalidatePath('/tasks')
    return { success: true }
  } catch (err: any) {
    if (err?.code === 'TYPED_CONFIRMATION_REQUIRED') {
      return { error: err.message, code: 'TYPED_CONFIRMATION_REQUIRED', status: 400 }
    }
    return { error: err.message || 'Failed to delete task.' }
  }
}

// Aggregate Team Workload
export async function fetchTeamWorkloadAction(): Promise<TeamWorkloadRecord[]> {
  try {
    const session = await getCurrentSessionContext()

    let profiles: { id: string; full_name: string; email?: string | null }[] = []
    if (session && session.organization) {
      const data = await query<{ id: string; full_name: string | null; email: string }>(
        `SELECT u.id, u.full_name, u.email
         FROM users u
         JOIN organization_members om ON om.user_id = u.id
         WHERE om.organization_id = $1`,
        [session.organization.id]
      )
      if (data) profiles = data.map((p) => ({ id: p.id, full_name: p.full_name || p.email || 'Team Member', email: p.email }))
    }

    if (profiles.length === 0) {
      return []
    }

    const allTasks = await fetchAllTasksAction()
    const today = new Date().toISOString().slice(0, 10)

    return profiles.map((member) => {
      const assignedTasks = allTasks.filter((t) => t.assigned_to === member.id)
      const activeCount = assignedTasks.filter((t) => t.status !== 'done').length
      const doneCount = assignedTasks.filter((t) => t.status === 'done').length
      const overdueCount = assignedTasks.filter(
        (t) => t.status !== 'done' && t.due_date && t.due_date < today
      ).length

      let level: 'Light' | 'Optimal' | 'Heavy' | 'Overloaded' = 'Optimal'
      if (activeCount === 0) level = 'Light'
      else if (activeCount <= 3) level = 'Optimal'
      else if (activeCount <= 6) level = 'Heavy'
      else level = 'Overloaded'

      return {
        id: member.id,
        full_name: member.full_name,
        email: member.email,
        active_tasks_count: activeCount,
        done_tasks_count: doneCount,
        overdue_tasks_count: overdueCount,
        total_assigned_count: assignedTasks.length,
        workload_level: level,
        assigned_tasks: assignedTasks
      }
    })
  } catch (err) {
    console.error('fetchTeamWorkloadAction error:', err)
    return []
  }
}

