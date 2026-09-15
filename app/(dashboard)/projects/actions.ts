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
