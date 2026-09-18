'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { fetchOrganizationAnalytics, AnalyticsDateRange } from '@/lib/analytics/data'
import { generateWeeklyReportNarrative } from '@/lib/ai/features/report-narrative'
import { isAIAccessible } from '@/lib/ai/client'

export async function generateAnalyticsNarrativeAction(range: AnalyticsDateRange = '30d') {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { success: false, error: 'Unauthorized: active session required.' }
    }

    const orgId = session.organization.id

    // Dual-tier gating check
    const gateCheck = await isAIAccessible(orgId, 'weekly_narrative')
    if (!gateCheck.allowed) {
      return {
        success: false,
        error: gateCheck.reason || 'AI Narrative reports are not enabled on your plan.',
      }
    }

    // Fetch real metrics for the organization
    const data = await fetchOrganizationAnalytics(orgId, range)

    const rangeLabel =
      range === '30d'
        ? 'Last 30 Days'
        : range === '90d'
        ? 'Last 90 Days'
        : range === 'ytd'
        ? 'Year to Date'
        : 'All-Time'

    const result = await generateWeeklyReportNarrative({
      organizationId: orgId,
      userId: session.user?.id || null,
      figures: {
        organizationName: session.organization.name || 'Our Agency',
        weekDateRange: rangeLabel,
        completedTasksCount: data.monthlyVelocity.reduce((acc, m) => acc + m.completedTasks, 0),
        activeProjectsCount: data.activeProjectsCount,
        newClientsCount: data.totalClientsCount,
        revenueGenerated: data.revenue.totalActiveValue,
        currency: 'USD',
        communicationVolume: data.totalProjects * 4,
        overdueItemsCount: data.overdueItems.length,
        inProgressProjects: data.revenue.byStage.map((s) => ({
          name: `${s.label} Projects`,
          status: s.stage,
          budgetUsed: s.totalValue,
          totalBudget: s.totalValue,
        })),
        openBlockers: data.overdueItems.slice(0, 3).map((item) => `${item.type.toUpperCase()}: ${item.title} (${Math.abs(item.daysDiff)} days overdue)`),
      },
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to generate narrative summary.',
      }
    }

    return {
      success: true,
      narrative: result.narrative,
    }
  } catch (err: any) {
    console.error('[Analytics:Action] Error generating narrative:', err)
    return {
      success: false,
      error: err.message || 'Failed to generate AI executive narrative.',
    }
  }
}
