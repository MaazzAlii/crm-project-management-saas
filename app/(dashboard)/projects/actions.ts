'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/logger'
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
      return getDevProjects()
    }

    const supabase = await createClient()

    let projects: ProjectRecord[] = []

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients ( name, company ),
          profiles ( full_name, email )
        `)
        .eq('organization_id', session.organization.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        projects = data.map((item: any) => ({
          id: item.id,
          organization_id: item.organization_id,
          client_id: item.client_id,
          client_name: item.clients?.name || 'Unknown Client',
          client_company: item.clients?.company || null,
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
          assigned_name: item.profiles?.full_name || item.profiles?.email || null,
          notes: item.notes,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }))
      }
    } catch (err) {}

    const devProjects = getDevProjects()
    const combined = [...projects, ...devProjects]
    const uniqueMap = new Map<string, ProjectRecord>()
    combined.forEach((p) => uniqueMap.set(p.id, p))

    return Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch (err) {
    return getDevProjects()
  }
}

export async function createProjectAction(formData: FormData) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized session context.' }
    }

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
      return { error: 'Client selection is required for a project.' }
    }

    if (!title) {
      return { error: 'Project title is required.' }
    }

    const supabase = await createClient()

    let newProject: { id: string } | null = null
    let insertError: any = null

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          organization_id: session.organization.id,
          client_id: clientId,
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
          assigned_to: assigned_to || null,
          notes,
        })
        .select('id')
        .single()

      newProject = data
      insertError = error

      // Scaffold tasks and deliverables if template_id is provided
      if (newProject && template_id) {
        try {
          const orgId = session.organization.id
          const [{ data: template }, { data: templateTasks }] = await Promise.all([
            supabase
              .from('project_templates')
              .select('*')
              .eq('id', template_id)
              .eq('organization_id', orgId)
              .single(),
            supabase
              .from('project_template_tasks')
              .select('*')
              .eq('template_id', template_id)
              .eq('organization_id', orgId)
          ])

          const baseStartDate = start_date ? new Date(start_date) : new Date()

          // Scaffold Tasks
          if (templateTasks && templateTasks.length > 0) {
            const taskInserts = templateTasks.map((tt) => {
              const taskDueDate = new Date(baseStartDate)
              taskDueDate.setDate(taskDueDate.getDate() + (tt.day_offset || 0))

              return {
                organization_id: orgId,
                project_id: newProject!.id,
                title: tt.title,
                description: tt.description || null,
                priority: tt.priority || 'medium',
                status: 'todo',
                due_date: taskDueDate.toISOString().slice(0, 10),
                assigned_to: assigned_to || null
              }
            })
            await supabase.from('tasks').insert(taskInserts)
          }

          // Scaffold Deliverables
          if (template && Array.isArray(template.default_deliverables)) {
            const deliverableInserts = template.default_deliverables.map((delTitle: string) => ({
              organization_id: orgId,
              project_id: newProject!.id,
              title: delTitle,
              status: 'pending',
              submitted_at: new Date().toISOString()
            }))
            if (deliverableInserts.length > 0) {
              await supabase.from('deliverables').insert(deliverableInserts)
            }
          }
        } catch (scaffoldErr) {
          console.error('Template scaffolding error:', scaffoldErr)
        }
      }
    } catch (err: any) {
      insertError = err
    }

    if ((insertError || !newProject) && process.env.DEV_SUPER_ADMIN === 'true') {
      const devProjId = 'dev-proj-' + Date.now()
      const devRecord: ProjectRecord = {
        id: devProjId,
        organization_id: session.organization.id,
        client_id: clientId,
        client_name: 'Agency Client',
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
        assigned_to: assigned_to || null,
        assigned_name: session.user.full_name || session.user.email,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      ;(global as any).__DEV_PROJECTS = (global as any).__DEV_PROJECTS || []
      ;(global as any).__DEV_PROJECTS.unshift(devRecord)

      revalidatePath('/projects')
      revalidatePath(`/clients/${clientId}`)
      return { success: true, projectId: devProjId }
    }

    if (insertError || !newProject) {
      console.error('Failed to create project:', insertError)
      return { error: insertError?.message || 'Database error occurred while creating project.' }
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
    console.error('createProjectAction error:', error)
    return { error: error?.message || 'Internal server error.' }
  }
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

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

    const supabase = await createClient()

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
      await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', projectId)
        .eq('organization_id', session.organization.id)
    } catch (err) {}

    if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_PROJECTS) {
      const idx = (global as any).__DEV_PROJECTS.findIndex((p: any) => p.id === projectId)
      if (idx !== -1) {
        ;(global as any).__DEV_PROJECTS[idx] = {
          ...(global as any).__DEV_PROJECTS[idx],
          ...updatePayload,
        }
      }
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
    return { error: error?.message || 'Failed to update project.' }
  }
}

export async function updateProjectStatusAction(projectId: string, newStatus: string) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

    const supabase = await createClient()

    try {
      await supabase
        .from('projects')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('organization_id', session.organization.id)
    } catch (err) {}

    if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_PROJECTS) {
      const idx = (global as any).__DEV_PROJECTS.findIndex((p: any) => p.id === projectId)
      if (idx !== -1) {
        ;(global as any).__DEV_PROJECTS[idx].status = newStatus
      }
    }

    revalidatePath('/projects')
    return { success: true }
  } catch (error: any) {
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

    const supabase = await createClient()

    try {
      await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('organization_id', session.organization.id)
    } catch (err) {}

    if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_PROJECTS) {
      ;(global as any).__DEV_PROJECTS = ((global as any).__DEV_PROJECTS as ProjectRecord[]).filter(
        (p) => p.id !== projectId
      )
    }

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

function getDevProjects(): ProjectRecord[] {
  if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_PROJECTS) {
    return (global as any).__DEV_PROJECTS as ProjectRecord[]
  }

  const defaultProjects: ProjectRecord[] = [
    {
      id: 'proj-1',
      organization_id: 'dev-org',
      client_id: 'client-1',
      client_name: 'Acme Agency Partner',
      client_company: 'Acme Corp',
      title: 'V2 AI Voice & CRM Portal Integration',
      description: 'Building custom automated voice workflow agent and real-time CRM dashboard.',
      type: 'AI Voice Agent',
      brief_source: 'WhatsApp',
      amount: 14500,
      currency: 'USD',
      status: 'Active',
      priority: 'high',
      start_date: new Date(Date.now() - 3600000 * 24 * 10).toISOString().slice(0, 10),
      deadline: new Date(Date.now() + 3600000 * 24 * 20).toISOString().slice(0, 10),
      assigned_to: 'dev-user-1',
      assigned_name: 'Lead Developer',
      notes: 'Phase 1 delivered, Phase 2 in progress.',
      created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'proj-2',
      organization_id: 'dev-org',
      client_id: 'client-2',
      client_name: 'Nexus Tech Global',
      client_company: 'Nexus Tech',
      title: 'UGC Content Creation & Media Ads Campaign',
      description: 'Production of 15 high-converting UGC video ads for TikTok and Instagram reels.',
      type: 'UGC Media',
      brief_source: 'Slack',
      amount: 8200,
      currency: 'USD',
      status: 'In Review',
      priority: 'medium',
      start_date: new Date(Date.now() - 3600000 * 24 * 15).toISOString().slice(0, 10),
      deadline: new Date(Date.now() + 3600000 * 24 * 5).toISOString().slice(0, 10),
      assigned_to: 'dev-user-2',
      assigned_name: 'Creative Director',
      notes: 'Videos uploaded to review portal.',
      created_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'proj-3',
      organization_id: 'dev-org',
      client_id: 'client-3',
      client_name: 'Solaria E-Commerce',
      client_company: 'Solaria Brands',
      title: 'Automated Billing & Subscription Webhook Pipeline',
      description: 'Stripe subscription syncing and automated client invoice generation.',
      type: 'Automation',
      brief_source: 'Email',
      amount: 6500,
      currency: 'USD',
      status: 'Completed',
      priority: 'low',
      start_date: new Date(Date.now() - 3600000 * 24 * 40).toISOString().slice(0, 10),
      deadline: new Date(Date.now() - 3600000 * 24 * 10).toISOString().slice(0, 10),
      assigned_to: 'dev-user-1',
      assigned_name: 'Backend Specialist',
      notes: 'Final invoice paid cleanly.',
      created_at: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'proj-4',
      organization_id: 'dev-org',
      client_id: 'client-4',
      client_name: 'Vanguard Marketing',
      client_company: 'Vanguard Group',
      title: 'Custom Client Portal & Analytics Board',
      description: 'Designing client-facing reporting view with live metric charts.',
      type: 'Combined',
      brief_source: 'Upwork',
      amount: 11000,
      currency: 'USD',
      status: 'Planning',
      priority: 'urgent',
      start_date: new Date(Date.now() + 3600000 * 24 * 2).toISOString().slice(0, 10),
      deadline: new Date(Date.now() + 3600000 * 24 * 30).toISOString().slice(0, 10),
      assigned_to: null,
      assigned_name: null,
      notes: 'Contract signed, awaiting initial kickoff call.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  return defaultProjects
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

    const supabase = await createClient()

    await supabase.from('project_activity_log').insert({
      organization_id: session.organization.id,
      project_id: projectId,
      actor_id: session.user?.id || null,
      actor_name: session.user?.full_name || session.user?.email || 'System User',
      action,
      details,
      created_at: new Date().toISOString()
    })
  } catch (e) {}
}

// Fetch single project detail with client & assigned profile
export async function fetchProjectDetailAction(projectId: string): Promise<ProjectRecord | null> {
  try {
    const session = await getCurrentSessionContext()
    const supabase = await createClient()

    if (session && session.organization) {
      const { data } = await supabase
        .from('projects')
        .select(`
          *,
          clients ( name, company ),
          profiles!projects_assigned_to_fkey ( full_name, email )
        `)
        .eq('id', projectId)
        .eq('organization_id', session.organization.id)
        .maybeSingle()

      if (data) {
        return {
          id: data.id,
          organization_id: data.organization_id,
          client_id: data.client_id,
          client_name: data.clients?.name || 'Client',
          client_company: data.clients?.company || null,
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
          assigned_name: data.profiles?.full_name || data.profiles?.email || null,
          notes: data.notes,
          created_at: data.created_at,
          updated_at: data.updated_at
        }
      }
    }

    // Dev Fallback
    const devProjects = getDevProjects()
    return devProjects.find((p) => p.id === projectId) || devProjects[0] || null
  } catch (err) {
    console.error('fetchProjectDetailAction error:', err)
    const devProjects = getDevProjects()
    return devProjects.find((p) => p.id === projectId) || null
  }
}

// Fetch deliverables for a project
export async function fetchProjectDeliverablesAction(projectId: string): Promise<DeliverableRecord[]> {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) return getDevDeliverables(projectId)

    const supabase = await createClient()

    const { data } = await supabase
      .from('deliverables')
      .select('*')
      .eq('project_id', projectId)
      .eq('organization_id', session.organization.id)
      .order('created_at', { ascending: false })

    if (data && data.length > 0) return data as DeliverableRecord[]
    return getDevDeliverables(projectId)
  } catch (err) {
    return getDevDeliverables(projectId)
  }
}

// Create deliverable action
export async function createDeliverableAction(projectId: string, formData: FormData) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

    const title = formData.get('title')?.toString().trim()
    const file_url = formData.get('file_url')?.toString().trim() || null
    const drive_link = formData.get('drive_link')?.toString().trim() || null

    if (!title) return { error: 'Deliverable title is required.' }

    const supabase = await createClient()
    const payload = {
      organization_id: session.organization.id,
      project_id: projectId,
      title,
      file_url,
      drive_link,
      status: 'pending',
      submitted_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('deliverables')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create deliverable:', error)
      return { error: error.message || 'Failed to create deliverable.' }
    }

    await logProjectActivity(projectId, 'DELIVERABLE_CREATED', { title })
    revalidatePath(`/projects/${projectId}`)
    return { success: true, deliverableId: data.id }
  } catch (err: any) {
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
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) return { error: 'Unauthorized.' }

    const supabase = await createClient()

    await supabase
      .from('deliverables')
      .update({
        status,
        client_feedback: clientFeedback || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', deliverableId)
      .eq('organization_id', session.organization.id)

    await logProjectActivity(projectId, 'DELIVERABLE_STATUS_UPDATED', {
      deliverableId,
      status,
      clientFeedback
    })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to update deliverable status.' }
  }
}

// Delete deliverable
export async function deleteDeliverableAction(deliverableId: string, projectId: string) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) return { error: 'Unauthorized.' }

    const supabase = await createClient()

    await supabase
      .from('deliverables')
      .delete()
      .eq('id', deliverableId)
      .eq('organization_id', session.organization.id)

    await logProjectActivity(projectId, 'DELIVERABLE_DELETED', { deliverableId })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to delete deliverable.' }
  }
}

// Fetch project tasks
export async function fetchProjectTasksAction(projectId: string): Promise<TaskRecord[]> {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) return getDevTasks(projectId)

    const supabase = await createClient()

    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        profiles ( full_name, email )
      `)
      .eq('project_id', projectId)
      .eq('organization_id', session.organization.id)
      .order('created_at', { ascending: true })

    if (data && data.length > 0) {
      return data.map((t) => ({
        id: t.id,
        organization_id: t.organization_id,
        project_id: t.project_id,
        title: t.title,
        description: t.description,
        assigned_to: t.assigned_to,
        assigned_name: t.profiles?.full_name || t.profiles?.email || null,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        completed_at: t.completed_at,
        created_at: t.created_at
      }))
    }

    return getDevTasks(projectId)
  } catch (err) {
    return getDevTasks(projectId)
  }
}

// Create task action
export async function createProjectTaskAction(projectId: string, formData: FormData) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.user || !session.organization) return { error: 'Unauthorized.' }

    const title = formData.get('title')?.toString().trim()
    const description = formData.get('description')?.toString().trim() || null
    const priority = (formData.get('priority')?.toString().trim() || 'medium') as any
    const due_date = formData.get('due_date')?.toString().trim() || null
    const assigned_to = formData.get('assigned_to')?.toString().trim() || null

    if (!title) return { error: 'Task title is required.' }

    const supabase = await createClient()
    const payload = {
      organization_id: session.organization.id,
      project_id: projectId,
      title,
      description,
      priority,
      status: 'todo',
      due_date,
      assigned_to: assigned_to || null
    }

    const { data, error } = await supabase.from('tasks').insert(payload).select('id').single()

    if (error) return { error: error.message || 'Failed to create task.' }

    await logProjectActivity(projectId, 'TASK_CREATED', { title })
    revalidatePath(`/projects/${projectId}`)
    return { success: true, taskId: data.id }
  } catch (err: any) {
    return { error: err.message || 'Failed to create task.' }
  }
}

// Update task status
export async function updateTaskStatusAction(
  taskId: string,
  projectId: string,
  newStatus: 'todo' | 'in_progress' | 'review' | 'done'
) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) return { error: 'Unauthorized.' }

    const supabase = await createClient()

    const updatePayload: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }
    if (newStatus === 'done') {
      updatePayload.completed_at = new Date().toISOString()
    }

    await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .eq('organization_id', session.organization.id)

    await logProjectActivity(projectId, 'TASK_STATUS_UPDATED', { taskId, newStatus })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to update task status.' }
  }
}

// Update project team assignee
export async function updateProjectTeamAssigneeAction(projectId: string, assignedToId: string | null) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) return { error: 'Unauthorized.' }

    const supabase = await createClient()

    await supabase
      .from('projects')
      .update({ assigned_to: assignedToId || null, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('organization_id', session.organization.id)

    await logProjectActivity(projectId, 'PROJECT_ASSIGNEE_UPDATED', { assignedToId })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to update team assignee.' }
  }
}

// Fetch activity log for project
export async function fetchProjectActivityLogAction(projectId: string): Promise<ProjectActivityLogRecord[]> {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) return getDevActivityLogs(projectId)

    const supabase = await createClient()

    const { data } = await supabase
      .from('project_activity_log')
      .select('*')
      .eq('project_id', projectId)
      .eq('organization_id', session.organization.id)
      .order('created_at', { ascending: false })

    if (data && data.length > 0) return data as ProjectActivityLogRecord[]
    return getDevActivityLogs(projectId)
  } catch (err) {
    return getDevActivityLogs(projectId)
  }
}

// Dev Fallbacks for Deliverables, Tasks & Activity Logs
function getDevDeliverables(projectId: string): DeliverableRecord[] {
  return [
    {
      id: 'del-1',
      organization_id: 'dev-org',
      project_id: projectId,
      title: 'Voice Bot Dialog Flow Architecture Diagram',
      drive_link: 'https://drive.google.com/file/d/voice-bot-flow',
      status: 'approved',
      client_feedback: 'Approved! Clean workflow design.',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'del-2',
      organization_id: 'dev-org',
      project_id: projectId,
      title: 'Twilio Webhook Integration & Audio Sample Test',
      drive_link: 'https://drive.google.com/file/d/audio-sample',
      status: 'pending',
      client_feedback: null,
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ]
}

function getDevTasks(projectId: string): TaskRecord[] {
  return [
    {
      id: 'task-1',
      organization_id: 'dev-org',
      project_id: projectId,
      title: 'Configure OpenAI Realtime API credentials & audio streaming',
      description: 'Set up low-latency web sockets for live voice agent response.',
      assigned_to: 'usr_1',
      assigned_name: 'Alex Johnson',
      status: 'done',
      priority: 'high',
      due_date: new Date(Date.now() - 3600000 * 24).toISOString().slice(0, 10),
      completed_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 72).toISOString()
    },
    {
      id: 'task-2',
      organization_id: 'dev-org',
      project_id: projectId,
      title: 'Build inbound call routing & fallback handler',
      description: 'Handle offline mode and send SMS callback link if user hangs up.',
      assigned_to: 'usr_2',
      assigned_name: 'Sarah Smith',
      status: 'in_progress',
      priority: 'urgent',
      due_date: new Date(Date.now() + 3600000 * 24 * 3).toISOString().slice(0, 10),
      created_at: new Date(Date.now() - 3600000 * 36).toISOString()
    },
    {
      id: 'task-3',
      organization_id: 'dev-org',
      project_id: projectId,
      title: 'Conduct end-to-end load test on 50 concurrent calls',
      description: 'Ensure system latency remains below 800ms during peak load.',
      assigned_to: 'usr_3',
      assigned_name: 'Michael Brown',
      status: 'todo',
      priority: 'medium',
      due_date: new Date(Date.now() + 3600000 * 24 * 7).toISOString().slice(0, 10),
      created_at: new Date(Date.now() - 3600000 * 10).toISOString()
    }
  ]
}

function getDevActivityLogs(projectId: string): ProjectActivityLogRecord[] {
  return [
    {
      id: 'act-1',
      organization_id: 'dev-org',
      project_id: projectId,
      actor_id: 'usr_1',
      actor_name: 'Alex Johnson',
      action: 'DELIVERABLE_CREATED',
      details: { title: 'Twilio Webhook Integration & Audio Sample Test' },
      created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'act-2',
      organization_id: 'dev-org',
      project_id: projectId,
      actor_id: 'usr_2',
      actor_name: 'Sarah Smith',
      action: 'TASK_STATUS_UPDATED',
      details: { taskId: 'task-1', newStatus: 'done' },
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'act-3',
      organization_id: 'dev-org',
      project_id: projectId,
      actor_id: 'usr_1',
      actor_name: 'System Admin',
      action: 'PROJECT_CREATED',
      details: { title: 'Project Kickoff' },
      created_at: new Date(Date.now() - 3600000 * 72).toISOString()
    }
  ]
}

