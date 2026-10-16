import { queryOne } from '@/lib/db'

export interface AdminDashboardMetrics {
  totalOrganizations: number
  activeOrganizations: number
  trialOrganizations: number
  canceledOrganizations: number
  suspendedOrganizations: number
  totalUsers: number
  activeUsers: number
  totalMrr: number
  totalClients: number
  totalProjects: number
  totalMessages: number
  pendingInvites: number
  monthlyAiTokens: number
}

const CACHE_TTL_MS = 60_000 // 60 seconds in-memory cache

interface CachedMetricsEntry {
  data: AdminDashboardMetrics
  timestamp: number
}

declare global {
  var __innoventix_admin_metrics_cache__: CachedMetricsEntry | undefined
}

/**
 * Clears the 60-second in-memory metrics cache (useful for testing or manual refreshes).
 */
export function clearAdminDashboardMetricsCache(): void {
  globalThis.__innoventix_admin_metrics_cache__ = undefined
}

/**
 * Fetches cross-tenant platform overview metrics with single-roundtrip aggregate SQL
 * and a 60-second in-memory cache on globalThis.__innoventix_admin_metrics_cache__.
 *
 * MRR Calculation (Guardrail 4):
 * - Sums price_monthly across active subscription plans for orgs with active subscriptions.
 * - Excludes free or lifetime plan tiers ($0).
 * - Excludes organizations with non-null plan overrides of 'lifetime' or 'sponsored' without
 *   an active paid stripe subscription, ensuring comped/override orgs never inflate MRR.
 */
export async function getAdminDashboardMetrics(forceRefresh = false): Promise<AdminDashboardMetrics> {
  const now = Date.now()
  if (
    !forceRefresh &&
    globalThis.__innoventix_admin_metrics_cache__ &&
    now - globalThis.__innoventix_admin_metrics_cache__.timestamp < CACHE_TTL_MS
  ) {
    return globalThis.__innoventix_admin_metrics_cache__.data
  }

  const row = await queryOne<any>(`
    SELECT
      (SELECT COUNT(*)::int FROM organizations) AS total_orgs,
      (SELECT COUNT(*)::int FROM organizations WHERE billing_status = 'active' AND (is_suspended IS FALSE OR is_suspended IS NULL)) AS active_orgs,
      (SELECT COUNT(*)::int FROM organizations WHERE billing_status = 'trialing') AS trial_orgs,
      (SELECT COUNT(*)::int FROM organizations WHERE billing_status = 'canceled') AS canceled_orgs,
      (SELECT COUNT(*)::int FROM organizations WHERE is_suspended IS TRUE) AS suspended_orgs,
      (SELECT COUNT(*)::int FROM users) AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE is_active IS TRUE) AS active_users,
      (SELECT COUNT(*)::int FROM clients) AS total_clients,
      (SELECT COUNT(*)::int FROM projects) AS total_projects,
      (SELECT COUNT(*)::int FROM communication_messages) AS total_messages,
      (SELECT COUNT(*)::int FROM invitations WHERE status = 'pending') AS pending_invites,
      (SELECT COALESCE(SUM(tokens_used), 0)::bigint FROM ai_usage_log WHERE created_at >= date_trunc('month', NOW())) AS monthly_ai_tokens,
      (SELECT COALESCE(SUM(sp.price_monthly), 0)::numeric
       FROM organization_subscriptions os
       JOIN subscription_plans sp ON sp.id = os.plan_id
       LEFT JOIN organization_plans op ON op.organization_id = os.organization_id
       WHERE os.status = 'active'
         AND sp.price_monthly > 0
         AND NOT (op.plan_override IN ('lifetime', 'sponsored') AND (os.stripe_subscription_id IS NULL OR os.stripe_subscription_id = ''))
      ) AS total_mrr
  `)

  const metrics: AdminDashboardMetrics = {
    totalOrganizations: Number(row?.total_orgs) || 0,
    activeOrganizations: Number(row?.active_orgs) || 0,
    trialOrganizations: Number(row?.trial_orgs) || 0,
    canceledOrganizations: Number(row?.canceled_orgs) || 0,
    suspendedOrganizations: Number(row?.suspended_orgs) || 0,
    totalUsers: Number(row?.total_users) || 0,
    activeUsers: Number(row?.active_users) || 0,
    totalMrr: Number(row?.total_mrr) || 0,
    totalClients: Number(row?.total_clients) || 0,
    totalProjects: Number(row?.total_projects) || 0,
    totalMessages: Number(row?.total_messages) || 0,
    pendingInvites: Number(row?.pending_invites) || 0,
    monthlyAiTokens: Number(row?.monthly_ai_tokens) || 0,
  }

  globalThis.__innoventix_admin_metrics_cache__ = {
    data: metrics,
    timestamp: now,
  }

  return metrics
}
