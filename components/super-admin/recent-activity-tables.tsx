import Link from 'next/link'
import { Building2, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react'

export interface RecentOrganization {
  id: string
  name: string
  slug: string
  plan_tier: string
  billing_status: string
  is_suspended?: boolean
  created_at: string
}

interface RecentActivityTablesProps {
  recentOrganizations: RecentOrganization[]
  flaggedOrganizations: RecentOrganization[]
}

export function RecentActivityTables({
  recentOrganizations,
  flaggedOrganizations,
}: RecentActivityTablesProps) {
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

  const getStatusBadge = (status: string, isSuspended?: boolean) => {
    if (isSuspended) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-300 border border-rose-500/30"> {/* // intentional: suspended status badge */}
          <AlertTriangle className="h-3 w-3" />
          Suspended
        </span>
      )
    }
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"> {/* // intentional: active status badge */}
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        )
      case 'trialing':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-300 border border-amber-500/30"> {/* // intentional: trialing status badge */}
            Trialing
          </span>
        )
      case 'past_due':
        return (
          <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:text-orange-300 border border-orange-500/30"> {/* // intentional: past due status badge */}
            Past Due
          </span>
        )
      case 'canceled':
        return (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
            Canceled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Recent Tenant Signups */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-card-foreground">Recent Tenant Signups</h3>
          </div>
          <Link
            href="/super-admin/organizations"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          {recentOrganizations.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No organizations found.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-3 px-2 font-medium">Organization</th>
                  <th className="py-3 px-2 font-medium">Plan</th>
                  <th className="py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {recentOrganizations.slice(0, 6).map((org) => (
                  <tr key={org.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2">
                      <Link
                        href={`/super-admin/organizations/${org.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {org.name}
                      </Link>
                      <div className="text-[11px] text-muted-foreground font-mono">/{org.slug}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold border ${getBadgeStyle(org.plan_tier)}`}>
                        {org.plan_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {getStatusBadge(org.billing_status, org.is_suspended)}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Flagged / Action Required Orgs */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" /> {/* // intentional: security alert warning icon */}
            <h3 className="text-base font-semibold text-card-foreground">Attention Required & Alerts</h3>
          </div>
          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-300 border border-amber-500/20"> {/* // intentional: flagged count warning badge */}
            {flaggedOrganizations.length} Flagged
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {flaggedOrganizations.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/50" /> {/* // intentional: all clean status icon */}
              <p className="mt-2 text-xs text-muted-foreground">All tenant organizations operating cleanly without billing issues or suspension alerts.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-3 px-2 font-medium">Organization</th>
                  <th className="py-3 px-2 font-medium">Plan</th>
                  <th className="py-3 px-2 font-medium">Flag Status</th>
                  <th className="py-3 px-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {flaggedOrganizations.slice(0, 6).map((org) => (
                  <tr key={org.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2 font-medium text-foreground">
                      {org.name}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold border ${getBadgeStyle(org.plan_tier)}`}>
                        {org.plan_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {getStatusBadge(org.billing_status, org.is_suspended)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Link
                        href={`/super-admin/organizations/${org.id}`}
                        className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
