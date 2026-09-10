import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { PlatformMetricsCards, type PlatformMetrics } from '@/components/super-admin/platform-metrics-cards'
import { RecentActivityTables } from '@/components/super-admin/recent-activity-tables'
import { ShieldCheck, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperAdminDashboardPage() {
  await requireSuperAdmin()
  const supabase = await createClient()

  // 1. Fetch Organizations
  const { data: orgsData } = await supabase
    .from('organizations')
    .select('id, name, slug, plan_tier, billing_status, is_suspended, created_at')
    .order('created_at', { ascending: false })

  const orgs = orgsData || []

  // 2. Fetch Subscriptions & Plan Prices for MRR Calculation
  const { data: subsData } = await supabase
    .from('organization_subscriptions')
    .select(`
      id,
      status,
      plan_id,
      subscription_plans (
        price_monthly,
        price_yearly
      )
    `)

  let totalMrr = 0
  if (subsData) {
    subsData.forEach((sub: any) => {
      if (sub.status === 'active' && sub.subscription_plans) {
        const monthly = Number(sub.subscription_plans.price_monthly) || 0
        totalMrr += monthly
      }
    })
  }

  // 3. Aggregate Counts across Platform
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })

  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })

  const { count: messagesCount } = await supabase
    .from('communication_messages')
    .select('*', { count: 'exact', head: true })

  // 4. Compute Breakdown Metrics
  const activeOrgs = orgs.filter((o) => o.billing_status === 'active' && !o.is_suspended).length
  const trialOrgs = orgs.filter((o) => o.billing_status === 'trialing').length
  const canceledOrgs = orgs.filter((o) => o.billing_status === 'canceled').length
  const suspendedOrgs = orgs.filter((o) => o.is_suspended).length

  const metrics: PlatformMetrics = {
    totalOrganizations: orgs.length,
    activeOrganizations: activeOrgs,
    trialOrganizations: trialOrgs,
    canceledOrganizations: canceledOrgs,
    suspendedOrganizations: suspendedOrgs,
    totalMrr: totalMrr,
    totalClients: clientsCount || 0,
    totalProjects: projectsCount || 0,
    totalMessages: messagesCount || 0,
  }

  const flaggedOrgs = orgs.filter(
    (o) => o.is_suspended || o.billing_status === 'past_due' || o.billing_status === 'canceled'
  )

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Platform Operator Overview
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Live Operator View
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time cross-tenant metrics, subscription revenue, and platform system health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Last synced: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <PlatformMetricsCards metrics={metrics} />

      {/* Tables Grid */}
      <RecentActivityTables
        recentOrganizations={orgs}
        flaggedOrganizations={flaggedOrgs}
      />
    </div>
  )
}
