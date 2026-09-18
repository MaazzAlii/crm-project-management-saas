import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { StatCard } from '@/components/dashboard/StatCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentActivity, type ActivityItem } from '@/components/dashboard/RecentActivity'
import { WeeklyReportButton } from '@/components/reports/WeeklyReportButton'
import { fetchWeeklyReportMetricsAction } from '@/app/(dashboard)/reports/actions'
import {
  Briefcase,
  CheckSquare,
  AlertTriangle,
  DollarSign,
  Inbox,
  Users,
  Plus,
  Building2,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const sessionContext = await getCurrentSessionContext()

  if (!sessionContext || !sessionContext.user) {
    redirect('/login')
  }

  if (!sessionContext.organization) {
    redirect('/onboarding')
  }

  const org = sessionContext.organization
  const supabase = await createClient()

  let activeProjectsCount = 0
  let pendingTasksCount = 0
  let overdueProjectsCount = 0
  let clientsCount = 0
  let unreadInboxCount = 0
  let recentActivities: ActivityItem[] = []

  try {
    // 1. Fetch Active Projects Count (RLS-scoped by orgId)
    const { count: pCount } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .neq('status', 'completed')

    activeProjectsCount = pCount || 0

    // 2. Fetch Pending Tasks Count
    const { count: tCount } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .neq('status', 'completed')

    pendingTasksCount = tCount || 0

    // 3. Fetch Overdue Projects Count
    const today = new Date().toISOString()
    const { count: oCount } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .neq('status', 'completed')
      .lt('target_completion_date', today)

    overdueProjectsCount = oCount || 0

    // 4. Fetch Clients Count
    const { count: cCount } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)

    clientsCount = cCount || 0

    // 5. Fetch Recent Projects as Recent Activity feed
    const { data: recentProjects } = await supabase
      .from('projects')
      .select('id, name, status, created_at')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentProjects && recentProjects.length > 0) {
      recentActivities = recentProjects.map((p) => ({
        id: p.id,
        title: `Project Created: ${p.name}`,
        description: `Status: ${p.status.toUpperCase()} · Org: ${org.name}`,
        timestamp: p.created_at,
        type: 'project',
      }))
    }
  } catch (err) {
    console.warn('[DASHBOARD_QUERY_WARN] Using fallback metric calculation:', err)
  }

  const isBrandNewOrg = clientsCount === 0 && activeProjectsCount === 0
  const reportData = await fetchWeeklyReportMetricsAction()

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Workspace Overview
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-400 border border-sky-500/20">
              <Building2 className="h-3.5 w-3.5" />
              {org.name}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Welcome back, <span className="font-semibold text-slate-200">{sessionContext.user.full_name || sessionContext.user.email}</span>. Here is your team&apos;s real-time operational summary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <WeeklyReportButton
            initialFigures={reportData.figures}
            aiEnabled={reportData.aiEnabled}
          />
          <Link
            href="/clients?action=new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition"
          >
            <Plus className="h-4 w-4" />
            Add New Client
          </Link>
        </div>
      </div>

      {/* Brand New Organization Onboarding Banner */}
      {isBrandNewOrg && (
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/60 via-slate-900 to-indigo-950/40 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-300 border border-sky-500/30">
                <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                Workspace Ready
              </div>
              <h2 className="text-lg font-bold text-white">Let&apos;s set up your agency workspace!</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your multi-tenant workspace <span className="font-semibold text-white">[{org.name}]</span> is initialized. Start by adding your first client or creating an active client project.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/clients?action=new"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-sky-400 transition"
              >
                <span>Add Your First Client</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Projects */}
        <StatCard
          title="Active Projects"
          value={activeProjectsCount}
          subtitle="Currently in progress"
          icon={Briefcase}
          variant="accent"
          trend="Real-time status"
        />

        {/* Pending Tasks */}
        <StatCard
          title="Pending Tasks"
          value={pendingTasksCount}
          subtitle="Awaiting completion"
          icon={CheckSquare}
          variant="default"
          trend="Cross-team workload"
        />

        {/* Overdue Projects */}
        <StatCard
          title="Overdue Projects"
          value={overdueProjectsCount}
          subtitle={overdueProjectsCount > 0 ? 'Requires immediate action' : 'All target dates on track'}
          icon={AlertTriangle}
          variant={overdueProjectsCount > 0 ? 'error' : 'success'}
          trend={overdueProjectsCount > 0 ? 'Urgent attention' : 'On schedule'}
        />

        {/* Total Clients */}
        <StatCard
          title="Active Clients"
          value={clientsCount}
          subtitle="Managed in CRM"
          icon={Users}
          variant="default"
          trend={`${org.plan_tier.toUpperCase()} Plan`}
        />
      </div>

      {/* Quick Actions & Recent Activity Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <QuickActions />

          {/* Secondary Overview Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Subscription & Resource Limits
              </h3>
              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
                {org.plan_tier.toUpperCase()} TIER
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Billing Status</span>
                <p className="text-sm font-bold text-emerald-400 capitalize mt-1">
                  {org.billing_status}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Client Count</span>
                <p className="text-sm font-bold text-white mt-1">
                  {clientsCount} <span className="text-xs font-normal text-slate-400">clients</span>
                </p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Projects Managed</span>
                <p className="text-sm font-bold text-white mt-1">
                  {activeProjectsCount} <span className="text-xs font-normal text-slate-400">active</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <RecentActivity items={recentActivities} />
        </div>
      </div>
    </div>
  )
}
