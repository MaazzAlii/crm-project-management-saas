import { query } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { PlatformMetricsCards } from '@/components/super-admin/platform-metrics-cards'
import { RecentActivityTables, type RecentOrganization } from '@/components/super-admin/recent-activity-tables'
import { getAdminDashboardMetrics } from '@/lib/services/dashboard-metrics'
import { ShieldCheck, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperAdminDashboardPage() {
  await requireSuperAdmin()

  // 1. Fetch Aggregated Platform Metrics (Cached for 60s in-memory, Guardrail 4 MRR computation)
  const metrics = await getAdminDashboardMetrics()

  // 2. Fetch Recent Organizations (Strictly bounded with LIMIT 10 to prevent heap exhaustion)
  let recentOrganizations: RecentOrganization[] = []
  let flaggedOrganizations: RecentOrganization[] = []

  try {
    const recentRes = await query<RecentOrganization>(
      `SELECT id, name, slug, plan_tier, billing_status, is_suspended, created_at
       FROM organizations
       ORDER BY created_at DESC
       LIMIT 10`
    )
    recentOrganizations = recentRes.rows || []

    const flaggedRes = await query<RecentOrganization>(
      `SELECT id, name, slug, plan_tier, billing_status, is_suspended, created_at
       FROM organizations
       WHERE is_suspended IS TRUE OR billing_status IN ('past_due', 'canceled')
       ORDER BY created_at DESC
       LIMIT 10`
    )
    flaggedOrganizations = flaggedRes.rows || []
  } catch (err) {
    console.error('[SUPER_ADMIN_DASHBOARD] Error loading recent organizations:', err)
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Platform Operator Overview
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-300 border border-purple-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Live Operator View
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time cross-tenant metrics, verified subscription revenue, and platform health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-pulse text-muted-foreground" />
            Live DB Telemetry (60s Cache)
          </span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <PlatformMetricsCards metrics={metrics} />

      {/* Tables Grid */}
      <RecentActivityTables
        recentOrganizations={recentOrganizations}
        flaggedOrganizations={flaggedOrganizations}
      />
    </div>
  )
}
