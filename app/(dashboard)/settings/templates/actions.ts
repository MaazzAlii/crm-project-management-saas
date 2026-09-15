'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'

export interface ProjectTemplateRecord {
  id: string
  organization_id: string
  name: string
  description?: string | null
  type?: string | null
  default_amount: number
  currency: string
  default_deliverables: string[]
  created_at: string
  tasks?: TemplateTaskRecord[]
}

export interface TemplateTaskRecord {
  id: string
  template_id: string
  title: string
  description?: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  day_offset: number
}

// Fetch all project templates for the active organization
export async function fetchProjectTemplatesAction(): Promise<ProjectTemplateRecord[]> {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.organization) {
      return getDevTemplates()
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('project_templates')
      .select(`
        *,
        project_template_tasks ( id, template_id, title, description, priority, day_offset )
      `)
      .eq('organization_id', session.organization.id)
      .order('name', { ascending: true })

    if (error || !data || data.length === 0) {
      return getDevTemplates()
    }

    return data.map((t) => ({
      id: t.id,
      organization_id: t.organization_id,
      name: t.name,
      description: t.description,
      type: t.type,
      default_amount: parseFloat(t.default_amount || '0'),
      currency: t.currency || 'USD',
      default_deliverables: Array.isArray(t.default_deliverables) ? t.default_deliverables : [],
      created_at: t.created_at,
      tasks: (t.project_template_tasks || []).map((task: any) => ({
        id: task.id,
        template_id: task.template_id,
        title: task.title,
        description: task.description,
        priority: task.priority || 'medium',
        day_offset: task.day_offset || 0
      }))
    }))
  } catch (err) {
    console.error('fetchProjectTemplatesAction error:', err)
    return getDevTemplates()
  }
}

// Create new template action
export async function createProjectTemplateAction(formData: FormData) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

    const name = formData.get('name')?.toString().trim()
    const description = formData.get('description')?.toString().trim() || null
    const type = formData.get('type')?.toString().trim() || 'Combined'
    const default_amount = parseFloat(formData.get('default_amount')?.toString() || '0')
    const currency = formData.get('currency')?.toString().trim() || 'USD'
    const deliverablesRaw = formData.get('default_deliverables')?.toString() || ''
    const tasksRaw = formData.get('tasks_json')?.toString() || '[]'

    if (!name) {
      return { error: 'Template name is required.' }
    }

    const orgId = session.organization.id

    const deliverables = deliverablesRaw
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean)

    let tasks: { title: string; description?: string; priority?: string; day_offset?: number }[] = []
    try {
      tasks = JSON.parse(tasksRaw)
    } catch (e) {}

    const supabase = await createClient()

    const { data: templateData, error: templateError } = await supabase
      .from('project_templates')
      .insert({
        organization_id: orgId,
        name,
        description,
        type,
        default_amount,
        currency,
        default_deliverables: deliverables
      })
      .select('id')
      .single()

    if (templateError || !templateData) {
      console.error('Failed to create template:', templateError)
      return { error: templateError?.message || 'Database error creating template.' }
    }

    // Insert template tasks
    if (tasks.length > 0) {
      const taskPayloads = tasks.map((t) => ({
        organization_id: orgId,
        template_id: templateData.id,
        title: t.title,
        description: t.description || null,
        priority: t.priority || 'medium',
        day_offset: t.day_offset || 0
      }))

      await supabase.from('project_template_tasks').insert(taskPayloads)
    }

    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'PROJECT_TEMPLATE_CREATED',
        targetType: 'template',
        targetId: templateData.id,
        details: { name, organizationId: session.organization.id }
      })
    } catch (e) {}

    revalidatePath('/settings/templates')
    revalidatePath('/projects')
    return { success: true, templateId: templateData.id }
  } catch (err: any) {
    return { error: err.message || 'Failed to create project template.' }
  }
}

// Delete template action
export async function deleteProjectTemplateAction(templateId: string) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

    const supabase = await createClient()

    await supabase
      .from('project_templates')
      .delete()
      .eq('id', templateId)
      .eq('organization_id', session.organization.id)

    revalidatePath('/settings/templates')
    revalidatePath('/projects')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to delete template.' }
  }
}

// Save existing project as reusable template
export async function saveProjectAsTemplateAction(projectId: string, templateName: string) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

    const supabase = await createClient()

    // Query source project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('organization_id', session.organization.id)
      .single()

    if (!project) {
      return { error: 'Project not found.' }
    }

    // Query tasks and deliverables for source project
    const [{ data: tasks }, { data: deliverables }] = await Promise.all([
      supabase.from('tasks').select('*').eq('project_id', projectId),
      supabase.from('deliverables').select('title').eq('project_id', projectId)
    ])

    const deliverablesList = (deliverables || []).map((d) => d.title)

    // Insert new template
    const { data: newTemplate, error: templateError } = await supabase
      .from('project_templates')
      .insert({
        organization_id: session.organization.id,
        name: templateName,
        description: `Saved from project "${project.title}"`,
        type: project.type || 'Combined',
        default_amount: parseFloat(project.amount || '0'),
        currency: project.currency || 'USD',
        default_deliverables: deliverablesList
      })
      .select('id')
      .single()

    if (templateError || !newTemplate) {
      return { error: templateError?.message || 'Failed to save template.' }
    }

    const orgId = session.organization.id

    // Insert template tasks
    if (tasks && tasks.length > 0) {
      const taskPayloads = tasks.map((t, idx) => ({
        organization_id: orgId,
        template_id: newTemplate.id,
        title: t.title,
        description: t.description || null,
        priority: t.priority || 'medium',
        day_offset: idx * 2 // spread tasks by offset
      }))
      await supabase.from('project_template_tasks').insert(taskPayloads)
    }

    revalidatePath('/settings/templates')
    return { success: true, templateId: newTemplate.id }
  } catch (err: any) {
    return { error: err.message || 'Failed to save project as template.' }
  }
}

// Dev Fallback Templates
function getDevTemplates(): ProjectTemplateRecord[] {
  return [
    {
      id: 'tmpl-1',
      organization_id: 'dev-org',
      name: 'AI Voice Agent Implementation',
      description: 'Standard workflow for deploying real-time AI voice agents for inbound/outbound calls.',
      type: 'AI Voice Agent',
      default_amount: 5000,
      currency: 'USD',
      default_deliverables: [
        'Voice Bot Architecture & Dialog Flow Diagram',
        'Twilio Webhook Integration & Audio Sample Test',
        'Final Load Testing & Quality Assurance Report'
      ],
      created_at: new Date().toISOString(),
      tasks: [
        {
          id: 'tt-1',
          template_id: 'tmpl-1',
          title: 'Configure OpenAI Realtime API credentials & audio streaming',
          description: 'Set up low-latency web sockets for live voice agent response.',
          priority: 'high',
          day_offset: 1
        },
        {
          id: 'tt-2',
          template_id: 'tmpl-1',
          title: 'Build inbound call routing & fallback handler',
          description: 'Handle offline mode and send SMS callback link if user hangs up.',
          priority: 'urgent',
          day_offset: 3
        },
        {
          id: 'tt-3',
          template_id: 'tmpl-1',
          title: 'Conduct end-to-end load test on 50 concurrent calls',
          description: 'Ensure system latency remains below 800ms during peak load.',
          priority: 'medium',
          day_offset: 7
        }
      ]
    },
    {
      id: 'tmpl-2',
      organization_id: 'dev-org',
      name: 'UGC Video Ads Campaign Template',
      description: 'Production pipeline for high-converting TikTok & Instagram UGC video ads.',
      type: 'UGC Media',
      default_amount: 8000,
      currency: 'USD',
      default_deliverables: [
        'Script & Hook Concepts Document',
        'Raw Video Clips Folder',
        '15 Edited Video Ads with Animated Subtitles'
      ],
      created_at: new Date().toISOString(),
      tasks: [
        {
          id: 'tt-4',
          template_id: 'tmpl-2',
          title: 'Draft 5 Hook Concepts & Script Angles',
          description: 'Focus on direct-response problem-solution hooks.',
          priority: 'high',
          day_offset: 1
        },
        {
          id: 'tt-5',
          template_id: 'tmpl-2',
          title: 'Receive creator raw footage and verify resolution',
          description: 'Ensure 4K vertical 9:16 format with clear audio.',
          priority: 'medium',
          day_offset: 5
        },
        {
          id: 'tt-6',
          template_id: 'tmpl-2',
          title: 'Edit first draft cuts with motion captions',
          description: 'Export 1080x1920 MP4 files.',
          priority: 'high',
          day_offset: 8
        }
      ]
    },
    {
      id: 'tmpl-3',
      organization_id: 'dev-org',
      name: 'Automated Billing & Webhook Pipeline',
      description: 'Stripe subscription syncing and automated client invoice generation.',
      type: 'Automation',
      default_amount: 4500,
      currency: 'USD',
      default_deliverables: [
        'Stripe Webhook Listener Service',
        'Automated Invoice PDF Generator',
        'Database Sync Schema Migration'
      ],
      created_at: new Date().toISOString(),
      tasks: [
        {
          id: 'tt-7',
          template_id: 'tmpl-3',
          title: 'Configure Stripe Webhook Secrets & Environment Variables',
          priority: 'high',
          day_offset: 1
        },
        {
          id: 'tt-8',
          template_id: 'tmpl-3',
          title: 'Build automated email invoice delivery on invoice.paid',
          priority: 'medium',
          day_offset: 4
        }
      ]
    }
  ]
}
