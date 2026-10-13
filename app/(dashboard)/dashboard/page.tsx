import Link from 'next/link'
import { redirect } from 'next/navigation'
import { query, queryOne } from '@/lib/db'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { getPlanUsage } from '@/lib/billing/usage'
import { StatCard } from '@/components/dashboard/StatCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentActivity, type ActivityItem } from '@/components/dashboard/RecentActivity'
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner'
import { DashboardTeamWidgets, type RecentMember, type RecentInvitation } from '@/components/dashboard/DashboardTeamWidgets'
import { WeeklyReportButton } from '@/components/reports/WeeklyReportButton'
import { fetchWeeklyReportMetricsAction } from '@/app/(dashboard)/reports/actions'
import {
  Briefcase,
  CheckSquare,
  AlertTriangle,
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

  // 1. Fetch Active Projects Count
  let activeProjectsCount = 0
  try {
    const pRes = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM projects WHERE organization_id = $1 AND status != 'completed'`,
      [org.id]
    )
    activeProjectsCount = pRes?.count || 0
  } catch (err: any) {
    console.warn('[Dashboard] Error fetching active projects:', err?.message)
  }

  // 2. Fetch Pending Tasks Count
  let pendingTasksCount = 0
  try {
    const tRes = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM tasks WHERE organization_id = $1 AND status != 'completed'`,
      [org.id]
    )
    pendingTasksCount = tRes?.count || 0
  } catch (err: any) {
    console.warn('[Dashboard] Error fetching pending tasks:', err?.message)
  }

  // 3. Fetch Overdue Projects Count
  let overdueProjectsCount = 0
  try {
    const oRes = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM projects
       WHERE organization_id = $1 AND status != 'completed' AND deadline < CURRENT_DATE`,
      [org.id]
    )
    overdueProjectsCount = oRes?.count || 0
  } catch (err: any) {
    console.warn('[Dashboard] Error fetching overdue projects:', err?.message)
  }

  // 4. Fetch Clients Count
  let clientsCount = 0
  try {
    const cRes = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM clients WHERE organization_id = $1`,
      [org.id]
    )
    clientsCount = cRes?.count || 0
  } catch (err: any) {
    console.warn('[Dashboard] Error fetching clients count:', err?.message)
  }

  // 5. Fetch Team Capacity & Usage (Prompt 40, 42, 44)
  let usage: any = {
    seatsUsed: 1,
    maxMembers: 5,
    planTier: org.plan_tier || 'free',
    pendingInvites: 0,
    emailVerified: !!sessionContext.user.email_verified,
    domainVerified: false,
  }
  try {
    usage = await getPlanUsage(org.id)
  } catch (err: any) {
    console.warn('[Dashboard] Error fetching plan usage:', err?.message)
  }

  // 6. Fetch 3 Most Recent Members (Prompt 44)
  let recentMembers: RecentMember[] = []
  try {
    const memberRows = await query<any>(
      `SELECT om.id, om.role, om.joined_at, u.full_name, u.email
       FROM organization_members om
       JOIN users u ON u.id = om.user_id
       WHERE om.organization_id = $1
       ORDER BY om.joined_at DESC
       LIMIT 3`,
      [org.id]
    )
    recentMembers = (memberRows.rows || []).map((m: any) => ({
      id: m.id,
      fullName: m.full_name || null,
      email: m.email,
      role: m.role,
      joinedAt: m.joined_at,
    }))
  } catch (err: any) {
    console.warn('[Dashboard] Error fetching recent members:', err?.message)
  }

  // 7. Fetch 3 Most Recent Pending Invitations (Prompt 44)
  let recentInvitations: RecentInvitation[] = []
  try {
    const inviteRows = await query<any>(
      `SELECT id, email, role, status, send_failed, expires_at as token_expires_at
       FROM invitations
       WHERE organization_id = $1 AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 3`,
      [org.id]
    )
    recentInvitations = (inviteRows.rows || []).map((i: any) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      status: i.status,
      sendFailed: i.send_failed,
      expiresAt: i.token_expires_at,
    }))
  } catch (err: any) {
    console.warn('[Dashboard] Error fetching recent invitations:', err?.message)
  }

  // 8. Fetch Real Audit Activity rows (Prompt 42)
  let recentActivities: ActivityItem[] = []
  try {
    const auditRows = await query<any>(
      `SELECT id, action, details, created_at
       FROM audit_logs
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [org.id]
    )

    if (auditRows.rows && auditRows.rows.length > 0) {
      recentActivities = auditRows.rows.map((a: any) => ({
        id: a.id,
        title: a.action.replace(/_/g, ' '),
        description: a.details ? JSON.stringify(a.details).slice(0, 80) : `Tenant: ${org.name}`,
        timestamp: a.created_at,
        type: a.action.includes('PROJECT') ? 'project' : a.action.includes('CLIENT') ? 'client' : a.action.includes('TASK') ? 'task' : 'general',
      }))
    }
  } catch {
    // If audit_logs table is empty, recentActivities stays empty
  }

  const isBrandNewOrg = clientsCount === 0 && activeProjectsCount === 0
  let reportData: any = {
    figures: {
      organizationName: org.name,
      weekDateRange: '',
      completedTasksCount: 0,
      activeProjectsCount: 0,
      newClientsCount: 0,
      revenueGenerated: 0,
      currency: 'USD',
      communicationVolume: 0,
      overdueItemsCount: 0,
      completedDeliverables: [],
      inProgressProjects: [],
    },
    aiEnabled: false,
  }
  try {
    reportData = await fetchWeeklyReportMetricsAction()
  } catch (err: any) {
    console.warn('[Dashboard] Error fetching weekly report metrics:', err?.message)
  }

  return (
    <div className="space-y-8">
      {/* Email Verification Banner (Prompt 39) */}
      <EmailVerificationBanner
        isVerified={sessionContext.user.email_verified}
        userEmail={sessionContext.user.email}
      />

      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Workspace Overview
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <Building2 className="h-3.5 w-3.5" />
              {org.name}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{sessionContext.user.full_name || sessionContext.user.email}</span>. Here is your team&apos;s real-time operational summary.
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

      {/* Brand New Organization Onboarding Banner (Prompt 42) */}
      {isBrandNewOrg && (
        <div className="relative overflow-hidden rounded-2xl border border-sky-300 dark:border-sky-500/30 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-sky-950/60 dark:via-slate-900 dark:to-indigo-950/40 p-6 shadow-md dark:shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300 border border-sky-500/30">
                <Sparkles className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                Workspace Ready
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Let&apos;s set up your agency workspace!</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Your multi-tenant workspace <span className="font-semibold text-slate-900 dark:text-white">[{org.name}]</span> is initialized. Start by adding your first client or creating an active client project.
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

      {/* Metrics Stat Cards Grid (Prompt 42: real numbers from DB) */}
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

      {/* Team & Invitation Widgets (Prompt 44) */}
      <DashboardTeamWidgets
        seatsUsed={usage.seatsUsed}
        seatsMax={usage.maxMembers}
        isFreePlan={usage.planTier === 'free'}
        recentMembers={recentMembers}
        pendingCount={usage.pendingInvites}
        recentInvitations={recentInvitations}
      />

      {/* Quick Actions & Recent Activity Layout (Prompt 43) */}
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
