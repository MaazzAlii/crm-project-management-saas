import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { emitAutomationEvent } from '@/lib/automation/emitter'

export const dynamic = 'force-dynamic'

interface AlertSummary {
  organizations_processed: number
  tasks_due_tomorrow_alerted: number
  projects_overdue_alerted: number
  duplicate_alerts_prevented: number
  errors: string[]
}

/**
 * Executes the deadline and overdue accountability check for all (or specific) organizations.
 * Implements N8N Flow 2 (Task Due Tomorrow Alert) and Flow 3 (Project Overdue Alert).
 * Idempotent: checks in_app_notifications to prevent sending duplicate alerts within the same calendar day.
 */
async function processDeadlineChecks(req: NextRequest): Promise<NextResponse> {
  // 1. Authenticate cron trigger via secret header
  const authHeader = req.headers.get('authorization')
  const cronSecretHeader = req.headers.get('x-cron-secret')
  const expectedSecret =
    process.env.CRON_SECRET || process.env.AUTOMATION_WEBHOOK_SECRET || 'dev-cron-secret'

  const providedSecret =
    cronSecretHeader || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '')

  const isDev = process.env.NODE_ENV !== 'production' || process.env.DEV_SUPER_ADMIN === 'true'
  if (!isDev && providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized: Invalid cron secret' }, { status: 401 })
  }

  // 2. Determine target organization(s)
  const url = new URL(req.url)
  const queryOrgId = url.searchParams.get('org_id')

  const summary: AlertSummary = {
    organizations_processed: 0,
    tasks_due_tomorrow_alerted: 0,
    projects_overdue_alerted: 0,
    duplicate_alerts_prevented: 0,
    errors: [],
  }

  try {
    let orgs: Array<{ id: string; name: string }> = []
    if (queryOrgId) {
      const res = await query<{ id: string; name: string }>(
        `SELECT id, name FROM organizations WHERE id = $1`,
        [queryOrgId]
      )
      orgs = res.rows
    } else {
      const res = await query<{ id: string; name: string }>(
        `SELECT id, name FROM organizations`
      )
      orgs = res.rows
    }

    summary.organizations_processed = orgs.length

    // Today & Tomorrow date bounds (UTC)
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()

    const tomorrow = new Date(now)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    for (const org of orgs) {
      try {
        // A. Query existing notifications sent today for deduplication
        const { rows: existingNotifs } = await query<{ related_entity_id: string; type: string }>(
          `SELECT related_entity_id, type FROM in_app_notifications
           WHERE organization_id = $1 AND created_at >= $2`,
          [org.id, startOfDay]
        )

        const alertedTaskIds = new Set(
          (existingNotifs || [])
            .filter((n) => n.type === 'deadline_approaching')
            .map((n) => n.related_entity_id)
        )

        const alertedProjectIds = new Set(
          (existingNotifs || [])
            .filter((n) => n.type === 'project_overdue')
            .map((n) => n.related_entity_id)
        )

        // B. N8N Flow 2: Tasks Due Tomorrow
        const { rows: dueTasks } = await query<any>(
          `SELECT t.id, t.title, t.due_date, t.priority, t.project_id, t.assigned_to, p.title as project_name
           FROM tasks t
           LEFT JOIN projects p ON p.id = t.project_id
           WHERE t.organization_id = $1 AND t.due_date = $2 AND t.status != 'done'`,
          [org.id, tomorrowStr]
        )

        if (dueTasks) {
          for (const task of dueTasks) {
            if (alertedTaskIds.has(task.id)) {
              summary.duplicate_alerts_prevented += 1
              continue
            }

            const projectName = task.project_name || 'Project'

            // Emit signed event to n8n
            await emitAutomationEvent({
              organizationId: org.id,
              event: 'task.deadline_approaching',
              data: {
                task_id: task.id,
                task_title: task.title,
                project_id: task.project_id,
                project_name: projectName,
                due_date: task.due_date,
                priority: task.priority || 'medium',
                assignee_id: task.assigned_to,
                assignee_name: 'Team Member',
                assignee_email: null,
              },
            })

            // Record in in_app_notifications for deduping & user center
            await query(
              `INSERT INTO in_app_notifications (organization_id, user_id, type, title, body, related_entity_type, related_entity_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                org.id,
                task.assigned_to || null,
                'deadline_approaching',
                `Task due tomorrow: ${task.title}`,
                `Your task "${task.title}" in project "${projectName}" is scheduled for delivery tomorrow.`,
                'task',
                task.id,
              ]
            )

            alertedTaskIds.add(task.id)
            summary.tasks_due_tomorrow_alerted += 1
          }
        }

        // C. N8N Flow 3: Projects Past Deadline (Overdue)
        const { rows: overdueProjects } = await query<any>(
          `SELECT p.id, p.title, p.deadline, p.status, p.client_id, p.assigned_to, c.name as client_name
           FROM projects p
           LEFT JOIN clients c ON c.id = p.client_id
           WHERE p.organization_id = $1 AND p.deadline < $2
             AND p.status NOT IN ('delivered','invoiced','paid','completed','on_hold','archived')`,
          [org.id, todayStr]
        )

        if (overdueProjects) {
          for (const project of overdueProjects) {
            if (alertedProjectIds.has(project.id)) {
              summary.duplicate_alerts_prevented += 1
              continue
            }

            const deadlineDate = new Date(project.deadline)
            const daysOverdue = Math.max(
              1,
              Math.floor((now.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24))
            )
            const clientName = project.client_name || 'Client'

            // Emit signed event to n8n
            await emitAutomationEvent({
              organizationId: org.id,
              event: 'project.overdue',
              data: {
                project_id: project.id,
                project_name: project.title,
                client_id: project.client_id,
                client_name: clientName,
                deadline: project.deadline,
                days_overdue: daysOverdue,
                status: project.status,
                owner_id: project.assigned_to || null,
                owner_name: 'Project Owner',
                owner_email: null,
              },
            })

            // Record in in_app_notifications for deduping & user center
            await query(
              `INSERT INTO in_app_notifications (organization_id, user_id, type, title, body, related_entity_type, related_entity_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                org.id,
                project.assigned_to || null,
                'project_overdue',
                `⚠️ Project overdue: ${project.title}`,
                `Project "${project.title}" for ${clientName} is ${daysOverdue} day(s) past target deadline.`,
                'project',
                project.id,
              ]
            )

            alertedProjectIds.add(project.id)
            summary.projects_overdue_alerted += 1
          }
        }
      } catch (orgErr: any) {
        summary.errors.push(`Org ${org.id}: ${orgErr?.message || 'Unknown error'}`)
      }
    }

    console.log('[Automation:Cron] Deadline check completed:', summary)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary,
    })
  } catch (err: any) {
    console.error('[Automation:Cron] Execution failure:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return processDeadlineChecks(req)
}

export async function POST(req: NextRequest) {
  return processDeadlineChecks(req)
}
