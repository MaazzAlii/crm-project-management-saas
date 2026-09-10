import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { SuspendOrgModal, OverridePlanModal } from '@/components/super-admin/org-management-actions'
import { PLAN_TIERS } from '@/lib/billing/plans'
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
  const supabase = await createClient()

  // 1. Fetch Organization Details
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!org) {
    notFound()
  }

  // 2. Fetch Subscription Details
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select(`
      *,
      subscription_plans (
        name,
        price_monthly,
        feature_limits
      )
    `)
    .eq('organization_id', org.id)
    .maybeSingle()

  // 3. Fetch Organization Members with Profiles
  const { data: membersData } = await supabase
    .from('organization_members')
    .select(`
      id,
      role,
      joined_at,
      profiles (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('organization_id', org.id)
    .order('joined_at', { ascending: true })

  // 4. Fetch Usage Metrics
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org.id)

  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org.id)

  const members = membersData || []
  const teamMemberCount = members.length
  const currentClients = clientsCount || 0
  const currentProjects = projectsCount || 0

  // Plan limits lookup
  const planTierConfig = PLAN_TIERS[org.plan_tier as keyof typeof PLAN_TIERS] || PLAN_TIERS.free
  const limits = planTierConfig.limits

  const getBadgeStyle = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      case 'pro':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      case 'starter':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50'
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Back Navigation */}
      <div>
        <Link
          href="/super-admin/organizations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to All Organizations
        </Link>
      </div>

      {/* Header Info Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">{org.name}</h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
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
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300 border border-rose-500/40">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  SUSPENDED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {org.billing_status.toUpperCase()}
                </span>
              )}

              {org.industry_type && (
                <span className="rounded-md bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300 border border-slate-700">
                  {org.industry_type}
                </span>
              )}
            </div>

            {org.is_suspended && org.suspended_reason && (
              <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                <strong>Suspension Audit Reason:</strong> {org.suspended_reason} (at{' '}
                {new Date(org.suspended_at).toLocaleString()})
              </div>
            )}
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-3">
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

      {/* Usage vs Plan Limits Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-400" />
          Tenant Usage vs Plan Limits
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Team Members Limit */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Team Members</span>
              <UserCheck className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white">
                {teamMemberCount}
              </span>
              <span className="text-xs font-mono text-slate-400">
                / {limits.max_team_members === Infinity ? 'Unlimited' : limits.max_team_members}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-950">
              <div
                className="h-full bg-purple-500 transition-all"
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
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Clients</span>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white">
                {currentClients}
              </span>
              <span className="text-xs font-mono text-slate-400">
                / {limits.max_clients === Infinity ? 'Unlimited' : limits.max_clients}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-950">
              <div
                className="h-full bg-blue-500 transition-all"
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
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Projects</span>
              <Briefcase className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white">
                {currentProjects}
              </span>
              <span className="text-xs font-mono text-slate-400">
                / {limits.max_projects === Infinity ? 'Unlimited' : limits.max_projects}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-950">
              <div
                className="h-full bg-emerald-500 transition-all"
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
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <CreditCard className="h-5 w-5 text-indigo-400" />
          Subscription & Stripe Billing Status
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Stripe Customer ID</span>
            <span className="font-mono text-white mt-1 block">
              {org.stripe_customer_id || subscription?.stripe_customer_id || 'N/A (Comped / Self-Hosted)'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Stripe Subscription ID</span>
            <span className="font-mono text-white mt-1 block">
              {subscription?.stripe_subscription_id || 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Current Period Start</span>
            <span className="text-slate-200 mt-1 block">
              {subscription?.current_period_start
                ? new Date(subscription.current_period_start).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Current Period End</span>
            <span className="text-slate-200 mt-1 block">
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Read-Only Team Members List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Organization Members ({members.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">Read-Only Audit View</span>
        </div>

        <div className="overflow-x-auto">
          {members.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No members attached to this organization.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-2 font-medium">User Profile</th>
                  <th className="py-3 px-2 font-medium">Email</th>
                  <th className="py-3 px-2 font-medium">Assigned Role</th>
                  <th className="py-3 px-2 font-medium">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {members.map((m: any) => {
                  const profile = m.profiles
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-2 font-semibold text-white">
                        {profile?.full_name || 'Unnamed User'}
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-300">
                        {profile?.email || 'N/A'}
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-300 border border-purple-500/20 capitalize">
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400">
                        {new Date(m.joined_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
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
