import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()

    let orgQuery = supabase.from('organizations').select('id, name')
    if (queryOrgId) {
      orgQuery = orgQuery.eq('id', queryOrgId)
    }

    const { data: organizations, error: orgError } = await orgQuery
    if (orgError) {
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }

    const orgs = organizations || []
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
        const { count: completedTasksCount } = await supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('status', 'done')
          .gte('updated_at', weekAgo.toISOString())

        // 2. Active Projects
        const { data: activeProjectsData } = await supabase
          .from('projects')
          .select('id, title, status, amount')
          .eq('organization_id', org.id)
          .in('status', ['brief_received', 'in_progress', 'review'])

        const activeProjectsCount = activeProjectsData?.length || 0

        // 3. New Clients (past 7 days)
        const { count: newClientsCount } = await supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .gte('created_at', weekAgo.toISOString())

        // 4. Revenue Delivered/Invoiced (past 7 days)
        const { data: revenueProjects } = await supabase
          .from('projects')
          .select('amount')
          .eq('organization_id', org.id)
          .in('status', ['delivered', 'invoiced', 'paid'])
          .gte('updated_at', weekAgo.toISOString())

        const revenueGenerated = (revenueProjects || []).reduce(
          (sum, p) => sum + (Number(p.amount) || 0),
          0
        )

        // 5. Communication Volume (past 7 days)
        let commVolume = 0
        try {
          const { count: msgCount } = await supabase
            .from('communication_messages')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .gte('created_at', weekAgo.toISOString())
          commVolume = msgCount || 0
        } catch {
          commVolume = 0
        }

        // 6. Overdue Projects
        const todayStr = now.toISOString().split('T')[0]
        const { count: overdueCount } = await supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .lt('deadline', todayStr)
          .not('status', 'in', '("delivered","invoiced","paid","completed","on_hold","archived")')

        const overdueItemsCount = overdueCount || 0

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
                completedTasksCount: completedTasksCount || 0,
                activeProjectsCount,
                newClientsCount: newClientsCount || 0,
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

        // C. Emit signed outbound event to n8n (N8N Flow 4)
        await emitAutomationEvent({
          organizationId: org.id,
          event: 'weekly.summary_ready',
          data: {
            period_start: weekAgo.toISOString(),
            period_end: now.toISOString(),
            metrics: {
              tasks_completed: completedTasksCount || 0,
              active_projects: activeProjectsCount,
              new_clients: newClientsCount || 0,
              revenue: revenueGenerated,
              communication_volume: commVolume,
              overdue_items: overdueItemsCount,
            },
            narrative_summary: narrativeSummary,
          },
        })

        // D. Insert notification for in-app notification center
        await supabase.from('in_app_notifications').insert({
          organization_id: org.id,
          type: 'weekly_summary',
          title: 'Weekly Performance Report Ready',
          body: `Executive summary for ${weekDateRange}: ${completedTasksCount || 0} tasks completed, ${activeProjectsCount} active projects, $${revenueGenerated.toLocaleString()} revenue generated.`,
          related_entity_type: 'report',
        })

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
