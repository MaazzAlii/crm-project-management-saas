'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db'
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

    const { rows } = await query<any>(
      `SELECT pt.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', ptt.id,
                    'template_id', ptt.template_id,
                    'title', ptt.title,
                    'description', ptt.description,
                    'priority', ptt.priority,
                    'day_offset', ptt.day_offset
                  )
                ) FILTER (WHERE ptt.id IS NOT NULL),
                '[]'
              ) as tasks
       FROM project_templates pt
       LEFT JOIN project_template_tasks ptt ON ptt.template_id = pt.id
       WHERE pt.organization_id = $1
       GROUP BY pt.id
       ORDER BY pt.name ASC`,
      [session.organization.id]
    )

    if (!rows || rows.length === 0) {
      return getDevTemplates()
    }

    return rows.map((t: any) => ({
      id: t.id,
      organization_id: t.organization_id,
      name: t.name,
      description: t.description,
      type: t.type,
      default_amount: parseFloat(t.default_amount || '0'),
      currency: t.currency || 'USD',
      default_deliverables: Array.isArray(t.default_deliverables)
        ? t.default_deliverables
        : typeof t.default_deliverables === 'string'
        ? JSON.parse(t.default_deliverables || '[]')
        : [],
      created_at: t.created_at,
      tasks: (typeof t.tasks === 'string' ? JSON.parse(t.tasks) : t.tasks || []).map((task: any) => ({
        id: task.id,
        template_id: task.template_id,
        title: task.title,
        description: task.description,
        priority: task.priority || 'medium',
        day_offset: task.day_offset || 0,
      })),
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

    const templateData = await queryOne<{ id: string }>(
      `INSERT INTO project_templates (
         organization_id, name, description, type, default_amount, currency, default_deliverables
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [orgId, name, description, type, default_amount, currency, JSON.stringify(deliverables)]
    )

    if (!templateData) {
      return { error: 'Database error creating template.' }
    }

    // Insert template tasks
    if (tasks.length > 0) {
      for (const t of tasks) {
        await query(
          `INSERT INTO project_template_tasks (
             organization_id, template_id, title, description, priority, day_offset
           ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [orgId, templateData.id, t.title, t.description || null, t.priority || 'medium', t.day_offset || 0]
        )
      }
    }

    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'PROJECT_TEMPLATE_CREATED',
        targetType: 'template',
        targetId: templateData.id,
        details: { name, organizationId: session.organization.id },
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

    await query(
      `DELETE FROM project_templates WHERE id = $1 AND organization_id = $2`,
      [templateId, session.organization.id]
    )

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

    // Query source project
    const project = await queryOne<any>(
      `SELECT * FROM projects WHERE id = $1 AND organization_id = $2`,
      [projectId, session.organization.id]
    )

    if (!project) {
      return { error: 'Project not found.' }
    }

    // Query tasks and deliverables for source project
    const tasksRes = await query<any>(`SELECT * FROM tasks WHERE project_id = $1`, [projectId])
    let deliverablesRes: { rows: any[] } = { rows: [] }
    try {
      deliverablesRes = await query<any>(`SELECT title FROM deliverables WHERE project_id = $1`, [projectId])
    } catch {}

    const deliverablesList = (deliverablesRes.rows || []).map((d) => d.title)

    // Insert new template
    const newTemplate = await queryOne<{ id: string }>(
      `INSERT INTO project_templates (
         organization_id, name, description, type, default_amount, currency, default_deliverables
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        session.organization.id,
        templateName,
        `Saved from project "${project.title}"`,
        project.type || 'Combined',
        parseFloat(project.amount || '0'),
        project.currency || 'USD',
        JSON.stringify(deliverablesList),
      ]
    )

    if (!newTemplate) {
      return { error: 'Failed to save template.' }
    }

    const orgId = session.organization.id

    // Insert template tasks
    if (tasksRes.rows && tasksRes.rows.length > 0) {
      for (let idx = 0; idx < tasksRes.rows.length; idx++) {
        const t = tasksRes.rows[idx]
        await query(
          `INSERT INTO project_template_tasks (
             organization_id, template_id, title, description, priority, day_offset
           ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [orgId, newTemplate.id, t.title, t.description || null, t.priority || 'medium', idx * 2]
        )
      }
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
        'Final Load Testing & Quality Assurance Report',
      ],
      created_at: new Date().toISOString(),
      tasks: [
        {
          id: 'tt-1',
          template_id: 'tmpl-1',
          title: 'Configure OpenAI Realtime API credentials & audio streaming',
          description: 'Set up low-latency web sockets for live voice agent response.',
          priority: 'high',
          day_offset: 1,
        },
        {
          id: 'tt-2',
          template_id: 'tmpl-1',
          title: 'Build inbound call routing & fallback handler',
          description: 'Handle offline mode and send SMS callback link if user hangs up.',
          priority: 'urgent',
          day_offset: 3,
        },
        {
          id: 'tt-3',
          template_id: 'tmpl-1',
          title: 'Conduct end-to-end load test on 50 concurrent calls',
          description: 'Ensure system latency remains below 800ms during peak load.',
          priority: 'medium',
          day_offset: 7,
        },
      ],
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
        '15 Edited Video Ads with Animated Subtitles',
      ],
      created_at: new Date().toISOString(),
      tasks: [
        {
          id: 'tt-4',
          template_id: 'tmpl-2',
          title: 'Draft 5 Hook Concepts & Script Angles',
          description: 'Focus on direct-response problem-solution hooks.',
          priority: 'high',
          day_offset: 1,
        },
        {
          id: 'tt-5',
          template_id: 'tmpl-2',
          title: 'Receive creator raw footage and verify resolution',
          description: 'Ensure 4K vertical 9:16 format with clear audio.',
          priority: 'medium',
          day_offset: 5,
        },
        {
          id: 'tt-6',
          template_id: 'tmpl-2',
          title: 'Edit first draft cuts with motion captions',
          description: 'Export 1080x1920 MP4 files.',
          priority: 'high',
          day_offset: 8,
        },
      ],
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
        'Database Sync Schema Migration',
      ],
      created_at: new Date().toISOString(),
      tasks: [
        {
          id: 'tt-7',
          template_id: 'tmpl-3',
          title: 'Configure Stripe Webhook Secrets & Environment Variables',
          priority: 'high',
          day_offset: 1,
        },
        {
          id: 'tt-8',
          template_id: 'tmpl-3',
          title: 'Build automated email invoice delivery on invoice.paid',
          priority: 'medium',
          day_offset: 4,
        },
      ],
    },
  ]
}
