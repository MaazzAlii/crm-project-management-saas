import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { fetchOrganizationAnalytics, AnalyticsDateRange } from '@/lib/analytics/data'
import { isAIAccessible } from '@/lib/ai/client'
import {
  AnalyticsHeader,
  RevenuePipelineCard,
  ProjectsByStatusChart,
  TeamWorkloadCard,
  DeadlinesAndOverdueCard,
  MonthlyCompletionRateCard,
} from '@/components/analytics'

export const metadata: Metadata = {
  title: 'Agency Analytics & Intelligence | Innoventix Hub',
  description:
    'Comprehensive executive analytics dashboard displaying revenue pipeline, project lifecycle distribution, team workload, deadlines, and delivery rate.',
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string }
}) {
  const session = await getCurrentSessionContext()

  if (!session || !session.organization) {
    redirect('/login')
  }

  const orgId = session.organization.id
  const range = (searchParams?.range || '30d') as AnalyticsDateRange

  // Fetch aggregate analytics data (RLS-scoped to current tenant)
  const analyticsData = await fetchOrganizationAnalytics(orgId, range)

  // Evaluate AI entitlement for the organization (zero-button rule enforced if disabled)
  let aiNarrativeEnabled = false
  try {
    const aiGate = await isAIAccessible(orgId, 'weekly_narrative')
    aiNarrativeEnabled = aiGate.allowed
  } catch {
    aiNarrativeEnabled = false
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Analytics Header with Range Selector & AI Briefing */}
      <AnalyticsHeader
        currentRange={range}
        aiEnabled={aiNarrativeEnabled}
        organizationName={session.organization.name || 'Agency Hub'}
      />

      {/* Primary Row: Revenue Pipeline & Projects by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <RevenuePipelineCard stats={analyticsData.revenue} />
        </div>
        <div className="lg:col-span-5">
          <ProjectsByStatusChart
            statuses={analyticsData.projectStatuses}
            totalProjects={analyticsData.totalProjects}
          />
        </div>
      </div>

      {/* Secondary Row: Deadlines & Overdue Items + Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <DeadlinesAndOverdueCard
            overdueItems={analyticsData.overdueItems}
            upcomingDeadlines={analyticsData.upcomingDeadlines}
          />
        </div>
        <div className="lg:col-span-6">
          <TeamWorkloadCard workload={analyticsData.teamWorkload} />
        </div>
      </div>

      {/* Tertiary Row: Monthly Delivery Velocity (Trailing 6 Months) */}
      <MonthlyCompletionRateCard
        velocity={analyticsData.monthlyVelocity}
        completionRate={analyticsData.monthlyCompletionRate}
      />
    </div>
  )
}
