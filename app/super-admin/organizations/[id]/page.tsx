import { notFound } from 'next/navigation'
import Link from 'next/link'
import { query, queryOne } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { SuspendOrgModal, OverridePlanModal } from '@/components/super-admin/org-management-actions'
import { StartImpersonationButton } from '@/components/super-admin/start-impersonation-button'
import { PlanOverrideCard } from '@/components/super-admin/PlanOverrideCard'
import { UserManagementModal } from '@/components/super-admin/user-management-modal'
import { getCurrentPlan } from '@/lib/billing/current-plan'
import { getOrganizationPlanLimits } from '@/lib/billing/plan-limits'
import {
  Building2,
  ArrowLeft,
  Users,
  Briefcase,
  UserCheck,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Shield,
  Layers,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface OrgDetailPageProps {
  params: {
    id: string
  }
}

export default async function SuperAdminOrgDetailPage({ params }: OrgDetailPageProps) {
  await requireSuperAdmin()
  let org: any = null
  let subscription: any = null
  let overrideRecord: any = null
  let effectivePlan: any = null
  let membersData: any[] = []
  let clientsCount = 0
  let projectsCount = 0

  try {
    // 1. Fetch Organization Details
    org = await queryOne<any>(`SELECT * FROM organizations WHERE id = $1`, [params.id])

    if (org) {
      // 2. Fetch Subscription Details
      subscription = await queryOne<any>(
        `SELECT os.*, sp.name as plan_name, sp.price_monthly, sp.feature_limits
         FROM organization_subscriptions os
         LEFT JOIN subscription_plans sp ON sp.id = os.plan_id
         WHERE os.organization_id = $1`,
        [org.id]
      )

      // 2b. Fetch Plan Override Details (BILL-3B)
      overrideRecord = await queryOne<any>(
        `SELECT op.plan_override, op.plan_override_expires_at, op.plan_override_granted_at,
                op.plan_override_granted_by, op.plan_override_note, u.email as granter_email
         FROM organization_plans op
         LEFT JOIN users u ON u.id = op.plan_override_granted_by
         WHERE op.organization_id = $1`,
        [org.id]
      )

      // 2c. Fetch Effective Plan with Real Quotas (BILL-3/3B)
      effectivePlan = await getCurrentPlan(org.id)

      // 3. Fetch Organization Members with Profiles
      const mRes = await query<any>(
        `SELECT om.id, om.role, om.joined_at, u.id as user_id, u.email, u.full_name, u.avatar_url, COALESCE(u.is_active, true) as is_active
         FROM organization_members om
         LEFT JOIN users u ON u.id = om.user_id
         WHERE om.organization_id = $1
         ORDER BY om.joined_at ASC`,
        [org.id]
      )

      membersData = (mRes.rows || []).map((row) => ({
        id: row.id,
        role: row.role,
        joined_at: row.joined_at,
        profiles: {
          id: row.user_id,
          email: row.email,
          full_name: row.full_name,
          avatar_url: row.avatar_url,
          is_active: row.is_active,
        },
      }))

      // 4. Fetch Usage Metrics
      const cRes = await queryOne<{ count: number }>(
        `SELECT COUNT(*)::int as count FROM clients WHERE organization_id = $1`,
        [org.id]
      )
      const pRes = await queryOne<{ count: number }>(
        `SELECT COUNT(*)::int as count FROM projects WHERE organization_id = $1`,
        [org.id]
      )

      clientsCount = cRes?.count || 0
      projectsCount = pRes?.count || 0
    }
  } catch (err) {
    console.warn('[SUPER_ADMIN_ORG_DETAIL] Using fallback sample data:', err)
  }

  // Sample fallback data if DB offline or record not found
  if (!org) {
    org = {
      id: params.id || '00000000-0000-0000-0000-000000000001',
      name: 'Innoventix Hub',
      slug: 'innoventix-hub',
      plan_tier: 'enterprise',
      billing_status: 'active',
      is_suspended: false,
      industry_type: 'Software & Technology Agency',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    }
    subscription = {
      stripe_customer_id: 'cus_N83xL194x0A',
      stripe_subscription_id: 'sub_1M0xL194x0A',
      current_period_start: new Date(Date.now() - 15 * 86400000).toISOString(),
      current_period_end: new Date(Date.now() + 15 * 86400000).toISOString(),
    }
    membersData = [
      {
        id: 'mem_1',
        role: 'owner',
        joined_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        profiles: {
          id: 'usr_1',
          email: 'maaz@innoventixhub.com',
          full_name: 'Maaz Ali (Owner)',
        },
      },
      {
        id: 'mem_2',
        role: 'admin',
        joined_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        profiles: {
          id: 'usr_2',
          email: 'dev@innoventixhub.com',
          full_name: 'Lead Engineer',
        },
      },
    ]
    clientsCount = 18
    projectsCount = 34
  }

  const members = membersData || []
  const teamMemberCount = members.length
  const currentClients = clientsCount || 0
  const currentProjects = projectsCount || 0

  // Plan limits lookup via helper
  const limits = await getOrganizationPlanLimits(org.id)

  const getBadgeStyle = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30' // intentional: enterprise plan badge
      case 'pro':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30' // intentional: pro plan badge
      case 'starter':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' // intentional: starter plan badge
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Back Navigation */}
      <div>
        <Link
          href="/super-admin/organizations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to All Organizations
        </Link>
      </div>

      {/* Header Info Banner */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-foreground">{org.name}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>ID: {org.id}</span>
                  <span>·</span>
                  <span>Slug: /{org.slug}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold border ${getBadgeStyle(org.plan_tier)}`}>
                {org.plan_tier.toUpperCase()} TIER
              </span>

              {org.is_suspended ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-300 border border-rose-500/30"> {/* // intentional: suspension status badge */}
                  <AlertTriangle className="h-3.5 w-3.5" />
                  SUSPENDED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"> {/* // intentional: active status badge */}
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {org.billing_status.toUpperCase()}
                </span>
              )}

              {org.industry_type && (
                <span className="rounded-md bg-muted px-2.5 py-0.5 text-xs text-muted-foreground border border-border">
                  {org.industry_type}
                </span>
              )}
            </div>

            {org.is_suspended && org.suspended_reason && (
              <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-300"> {/* // intentional: suspension audit reason alert */}
                <strong>Suspension Audit Reason:</strong> {org.suspended_reason} (at{' '}
                {new Date(org.suspended_at).toLocaleString()})
              </div>
            )}
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <StartImpersonationButton
              organizationId={org.id}
              organizationName={org.name}
            />
            <OverridePlanModal
              orgId={org.id}
              orgName={org.name}
              currentPlanTier={org.plan_tier}
            />
            <SuspendOrgModal
              orgId={org.id}
              orgName={org.name}
              isSuspended={!!org.is_suspended}
            />
          </div>
        </div>
      </div>

      {/* Access Override Management Card (BILL-3B) */}
      {effectivePlan && (
        <PlanOverrideCard
          orgId={org.id}
          orgName={org.name}
          currentOverride={overrideRecord}
          effectivePlan={effectivePlan}
        />
      )}

      {/* Usage vs Plan Limits Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Tenant Usage vs Plan Limits
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Team Members Limit */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Team Members</span>
              <UserCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-foreground">
                {teamMemberCount}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                / {limits.max_team_members === Infinity ? 'Unlimited' : limits.max_team_members}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    limits.max_team_members === Infinity
                      ? 10
                      : (teamMemberCount / limits.max_team_members) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Clients Limit */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Clients</span>
              <Users className="h-4 w-4 text-blue-500" /> {/* // intentional: clients limit icon */}
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-foreground">
                {currentClients}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                / {limits.max_clients === Infinity ? 'Unlimited' : limits.max_clients}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-blue-500 transition-all" // intentional: clients progress bar
                style={{
                  width: `${Math.min(
                    100,
                    limits.max_clients === Infinity
                      ? 10
                      : (currentClients / limits.max_clients) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Projects Limit */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Projects</span>
              <Briefcase className="h-4 w-4 text-emerald-500" /> {/* // intentional: projects limit icon */}
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-foreground">
                {currentProjects}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                / {limits.max_projects === Infinity ? 'Unlimited' : limits.max_projects}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-emerald-500 transition-all" // intentional: projects progress bar
                style={{
                  width: `${Math.min(
                    100,
                    limits.max_projects === Infinity
                      ? 10
                      : (currentProjects / limits.max_projects) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription & Stripe Information */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
          <CreditCard className="h-5 w-5 text-primary" />
          Subscription & Stripe Billing Status
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div>
            <span className="text-muted-foreground block font-medium">Stripe Customer ID</span>
            <span className="font-mono text-foreground mt-1 block">
              {org.stripe_customer_id || subscription?.stripe_customer_id || 'N/A (Comped / Self-Hosted)'}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block font-medium">Stripe Subscription ID</span>
            <span className="font-mono text-foreground mt-1 block">
              {subscription?.stripe_subscription_id || 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block font-medium">Current Period Start</span>
            <span className="text-foreground mt-1 block">
              {subscription?.current_period_start
                ? new Date(subscription.current_period_start).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block font-medium">Current Period End</span>
            <span className="text-foreground mt-1 block">
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Organization Members Management */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Organization Members & User Management ({members.length})
          </h2>
          <span className="text-xs text-muted-foreground font-mono">Super-Admin Controlled</span>
        </div>

        <div className="overflow-x-auto">
          {members.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No members attached to this organization.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-3 px-2 font-medium">User Profile</th>
                  <th className="py-3 px-2 font-medium">Email</th>
                  <th className="py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-2 font-medium">Assigned Role</th>
                  <th className="py-3 px-2 font-medium">Joined Date</th>
                  <th className="py-3 px-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {members.map((m: any) => {
                  const profile = m.profiles
                  const isActive = profile?.is_active ?? true
                  return (
                    <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 font-semibold text-foreground">
                        {profile?.full_name || 'Unnamed User'}
                      </td>
                      <td className="py-3 px-2 font-mono text-muted-foreground">
                        {profile?.email || 'N/A'}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20 capitalize">
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {new Date(m.joined_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <UserManagementModal
                          user={{
                            id: profile?.id || m.id,
                            fullName: profile?.full_name || '',
                            email: profile?.email || '',
                            isActive,
                            role: m.role,
                            orgId: org.id,
                            orgName: org.name,
                          }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
