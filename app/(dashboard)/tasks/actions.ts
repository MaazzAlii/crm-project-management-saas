'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
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
      return getDevGlobalTasks()
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects ( title ),
        profiles ( full_name, email )
      `)
      .eq('organization_id', session.organization.id)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error || !data || data.length === 0) {
      return getDevGlobalTasks()
    }

    return data.map((t) => ({
      id: t.id,
      organization_id: t.organization_id,
      project_id: t.project_id,
      project_title: t.projects?.title || 'Agency Project',
      title: t.title,
      description: t.description,
      assigned_to: t.assigned_to,
      assigned_name: t.profiles?.full_name || t.profiles?.email || null,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      completed_at: t.completed_at,
      created_at: t.created_at,
      updated_at: t.updated_at
    }))
  } catch (err) {
    console.error('fetchAllTasksAction error:', err)
    return getDevGlobalTasks()
  }
}

// Create new task
export async function createGlobalTaskAction(formData: FormData) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

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

    const supabase = await createClient()

    const payload = {
      organization_id: session.organization.id,
      project_id,
      title,
      description,
      assigned_to: assigned_to || null,
      priority,
      status,
      due_date
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create task:', error)
      return { error: error.message || 'Database error creating task.' }
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
    return { error: err.message || 'Failed to create task.' }
  }
}

// Update task action
export async function updateGlobalTaskAction(taskId: string, formData: FormData) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

    const title = formData.get('title')?.toString().trim()
    const description = formData.get('description')?.toString().trim() || null
    const assigned_to = formData.get('assigned_to')?.toString().trim() || null
    const priority = (formData.get('priority')?.toString().trim() || 'medium') as any
    const status = (formData.get('status')?.toString().trim() || 'todo') as any
    const due_date = formData.get('due_date')?.toString().trim() || null

    if (!title) {
      return { error: 'Task title is required.' }
    }

    const supabase = await createClient()

    const updatePayload: any = {
      title,
      description,
      assigned_to: assigned_to || null,
      priority,
      status,
      due_date,
      updated_at: new Date().toISOString()
    }

    if (status === 'done') {
      updatePayload.completed_at = new Date().toISOString()
    } else {
      updatePayload.completed_at = null
    }

    await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .eq('organization_id', session.organization.id)

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
    return { error: err.message || 'Failed to update task.' }
  }
}

// Quick status toggle
export async function toggleGlobalTaskStatusAction(taskId: string, newStatus: 'todo' | 'in_progress' | 'review' | 'done') {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

    const supabase = await createClient()

    const updatePayload: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (newStatus === 'done') {
      updatePayload.completed_at = new Date().toISOString()
    } else {
      updatePayload.completed_at = null
    }

    await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .eq('organization_id', session.organization.id)

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
    return { error: err.message || 'Failed to toggle status.' }
  }
}

// Delete task
export async function deleteGlobalTaskAction(taskId: string) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

    const supabase = await createClient()

    await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('organization_id', session.organization.id)

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
    return { error: err.message || 'Failed to delete task.' }
  }
}

// Aggregate Team Workload
export async function fetchTeamWorkloadAction(): Promise<TeamWorkloadRecord[]> {
  try {
    const session = await getCurrentSessionContext()

    let profiles: { id: string; full_name: string; email?: string | null }[] = []
    if (session && session.organization) {
      const supabase = await createClient()
      const { data } = await supabase.from('profiles').select('id, full_name, email')
      if (data) profiles = data.map((p) => ({ id: p.id, full_name: p.full_name || p.email || 'Team Member', email: p.email }))
    }

    if (profiles.length === 0) {
      profiles = [
        { id: 'usr_1', full_name: 'Alex Johnson', email: 'alex@agency.com' },
        { id: 'usr_2', full_name: 'Sarah Smith', email: 'sarah@agency.com' },
        { id: 'usr_3', full_name: 'Michael Brown', email: 'michael@agency.com' }
      ]
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

// Dev Fallback Data
function getDevGlobalTasks(): GlobalTaskRecord[] {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 3600000 * 24).toISOString().slice(0, 10)
  const tomorrow = new Date(now.getTime() + 3600000 * 24).toISOString().slice(0, 10)
  const nextWeek = new Date(now.getTime() + 3600000 * 24 * 7).toISOString().slice(0, 10)

  return [
    {
      id: 'tsk-101',
      organization_id: 'dev-org',
      project_id: 'proj-1',
      project_title: 'Voice Agent AI Integration',
      title: 'Configure Webhook Endpoints & API Key Security',
      description: 'Setup TLS encryption & auth token verification for voice webhooks.',
      assigned_to: 'usr_1',
      assigned_name: 'Alex Johnson',
      status: 'in_progress',
      priority: 'high',
      due_date: yesterday, // Overdue
      created_at: new Date(now.getTime() - 3600000 * 48).toISOString()
    },
    {
      id: 'tsk-102',
      organization_id: 'dev-org',
      project_id: 'proj-1',
      project_title: 'Voice Agent AI Integration',
      title: 'Audio Speech Synthesis & Latency Tuning',
      description: 'Optimize audio output buffer to achieve sub-800ms response.',
      assigned_to: 'usr_2',
      assigned_name: 'Sarah Smith',
      status: 'todo',
      priority: 'urgent',
      due_date: tomorrow,
      created_at: new Date(now.getTime() - 3600000 * 24).toISOString()
    },
    {
      id: 'tsk-103',
      organization_id: 'dev-org',
      project_id: 'proj-2',
      project_title: 'UGC Content Creation Campaign',
      title: 'Review Video Clips & Add Subtitles',
      description: 'Export 15 UGC video ads with animated closed captions.',
      assigned_to: 'usr_3',
      assigned_name: 'Michael Brown',
      status: 'review',
      priority: 'medium',
      due_date: nextWeek,
      created_at: new Date(now.getTime() - 3600000 * 72).toISOString()
    },
    {
      id: 'tsk-104',
      organization_id: 'dev-org',
      project_id: 'proj-3',
      project_title: 'Automated Billing Webhook Pipeline',
      title: 'Stripe Webhook Event Signature Validation',
      description: 'Implement HMAC signature check for Stripe webhooks.',
      assigned_to: 'usr_1',
      assigned_name: 'Alex Johnson',
      status: 'done',
      priority: 'low',
      due_date: yesterday,
      completed_at: new Date().toISOString(),
      created_at: new Date(now.getTime() - 3600000 * 120).toISOString()
    }
  ]
}
