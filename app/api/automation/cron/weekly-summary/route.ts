import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { emitAutomationEvent } from '@/lib/automation/emitter'
import { checkAIAccess } from '@/lib/ai/guard'
import { generateWeeklyReportNarrative } from '@/lib/ai/features/report-narrative'

export const dynamic = 'force-dynamic'

interface WeeklySummaryRunResult {
  organizations_processed: number
  summaries_emitted: number
  narratives_generated: number
  errors: string[]
}

async function processWeeklySummary(req: NextRequest): Promise<NextResponse> {
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

  const url = new URL(req.url)
  const queryOrgId = url.searchParams.get('org_id')

  const results: WeeklySummaryRunResult = {
    organizations_processed: 0,
    summaries_emitted: 0,
    narratives_generated: 0,
    errors: [],
  }

  try {
    let orgs: Array<{ id: string; name: string }> = []
    try {
      if (queryOrgId) {
        const { rows } = await query<{ id: string; name: string }>(
          `SELECT id, name FROM organizations WHERE id = $1`,
          [queryOrgId]
        )
        orgs = rows
      } else {
        const { rows } = await query<{ id: string; name: string }>(
          `SELECT id, name FROM organizations`
        )
        orgs = rows
      }
    } catch (e) {
      if (!isDev) {
        return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
      }
    }

    if (orgs.length === 0 && isDev) {
      orgs = [{ id: 'dev-org', name: 'Innoventix Hub Agency' }]
    }

    results.organizations_processed = orgs.length

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekDateRange = `${weekAgo.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} – ${now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`

    for (const org of orgs) {
      try {
        // A. Aggregate performance figures across modules
        // 1. Completed Tasks (past 7 days)
        const completedTasksRow = await queryOne<{ count: number }>(
          `SELECT COUNT(*)::int as count FROM tasks
           WHERE organization_id = $1 AND status = 'done' AND updated_at >= $2`,
          [org.id, weekAgo.toISOString()]
        )
        const completedTasksCount = completedTasksRow?.count || 0

        // 2. Active Projects
        const { rows: activeProjectsData } = await query<{ id: string; title: string; status: string; amount: number }>(
          `SELECT id, title, status, amount FROM projects
           WHERE organization_id = $1 AND status IN ('brief_received', 'in_progress', 'review')`,
          [org.id]
        )
        const activeProjectsCount = activeProjectsData?.length || 0

        // 3. New Clients (past 7 days)
        const newClientsRow = await queryOne<{ count: number }>(
          `SELECT COUNT(*)::int as count FROM clients
           WHERE organization_id = $1 AND created_at >= $2`,
          [org.id, weekAgo.toISOString()]
        )
        const newClientsCount = newClientsRow?.count || 0

        // 4. Revenue Delivered/Invoiced (past 7 days)
        const { rows: revenueProjects } = await query<{ amount: number }>(
          `SELECT amount FROM projects
           WHERE organization_id = $1 AND status IN ('delivered', 'invoiced', 'paid') AND updated_at >= $2`,
          [org.id, weekAgo.toISOString()]
        )

        const revenueGenerated = (revenueProjects || []).reduce(
          (sum, p) => sum + (Number(p.amount) || 0),
          0
        )

        // 5. Communication Volume (past 7 days)
        let commVolume = 0
        try {
          const msgCountRow = await queryOne<{ count: number }>(
            `SELECT COUNT(*)::int as count FROM communication_messages
             WHERE organization_id = $1 AND created_at >= $2`,
            [org.id, weekAgo.toISOString()]
          )
          commVolume = msgCountRow?.count || 0
        } catch {
          commVolume = 0
        }

        // 6. Overdue Projects
        const todayStr = now.toISOString().split('T')[0]
        const overdueRow = await queryOne<{ count: number }>(
          `SELECT COUNT(*)::int as count FROM projects
           WHERE organization_id = $1 AND deadline < $2
             AND status NOT IN ('delivered','invoiced','paid','completed','on_hold','archived')`,
          [org.id, todayStr]
        )
        const overdueItemsCount = overdueRow?.count || 0

        // B. Generate AI Narrative if enabled (3-tier gating check)
        let narrativeSummary: string | undefined = undefined
        const aiGate = await checkAIAccess(org.id, 'weekly_narrative')

        if (aiGate.allowed) {
          try {
            const narrativeRes = await generateWeeklyReportNarrative({
              organizationId: org.id,
              figures: {
                organizationName: org.name,
                weekDateRange,
                completedTasksCount,
                activeProjectsCount,
                newClientsCount,
                revenueGenerated,
                currency: 'USD',
                communicationVolume: commVolume,
                overdueItemsCount,
              },
            })

            if (narrativeRes.success && narrativeRes.narrative) {
              narrativeSummary = narrativeRes.narrative
              results.narratives_generated += 1
            }
          } catch (aiErr) {
            console.warn(`[Automation:WeeklySummary] AI narrative failed for org ${org.id}:`, aiErr)
          }
        }

        if (!narrativeSummary && isDev) {
          narrativeSummary = `Executive Weekly Digest for ${org.name}: Operations are running smoothly with ${completedTasksCount || 8} milestone tasks delivered and ${activeProjectsCount || 3} active agency projects on schedule. Omnichannel communication across Slack and WhatsApp remained active with healthy client sentiment.`
        }

        // C. Emit signed outbound event to n8n (N8N Flow 4)
        try {
          await emitAutomationEvent({
            organizationId: org.id,
            event: 'weekly.summary_ready',
            data: {
              period_start: weekAgo.toISOString(),
              period_end: now.toISOString(),
              metrics: {
                tasks_completed: completedTasksCount,
                active_projects: activeProjectsCount,
                new_clients: newClientsCount,
                revenue: revenueGenerated,
                communication_volume: commVolume,
                overdue_items: overdueItemsCount,
              },
              narrative_summary: narrativeSummary,
            },
          })
        } catch (emitErr) {
          console.warn('[Automation:WeeklySummary] Event emission skipped:', emitErr)
        }

        // D. Insert notification for in-app notification center
        try {
          await query(
            `INSERT INTO in_app_notifications (organization_id, type, title, body, related_entity_type)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              org.id,
              'weekly_summary',
              'Weekly Performance Report Ready',
              `Executive summary for ${weekDateRange}: ${completedTasksCount} tasks completed, ${activeProjectsCount} active projects, $${revenueGenerated.toLocaleString()} revenue generated.`,
              'report',
            ]
          )
        } catch (notifErr) {
          console.warn('[Automation:WeeklySummary] In-app notification insert skipped:', notifErr)
        }

        results.summaries_emitted += 1
      } catch (orgErr: any) {
        results.errors.push(`Org ${org.id}: ${orgErr?.message || 'Error processing'}`)
      }
    }

    console.log('[Automation:WeeklySummary] Run finished:', results)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    })
  } catch (err: any) {
    console.error('[Automation:WeeklySummary] Cron execution error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return processWeeklySummary(req)
}

export async function POST(req: NextRequest) {
  return processWeeklySummary(req)
}
