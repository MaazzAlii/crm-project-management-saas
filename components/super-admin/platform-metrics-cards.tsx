import { Building2, DollarSign, Users, Briefcase, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react'

export interface PlatformMetrics {
  totalOrganizations: number
  activeOrganizations: number
  trialOrganizations: number
  canceledOrganizations: number
  suspendedOrganizations: number
  totalMrr: number
  totalClients: number
  totalProjects: number
  totalMessages: number
}

interface PlatformMetricsCardsProps {
  metrics: PlatformMetrics
}

export function PlatformMetricsCards({ metrics }: PlatformMetricsCardsProps) {
  const cards = [
    {
      title: 'Total Organizations',
      value: metrics.totalOrganizations.toLocaleString(),
      subtitle: `${metrics.activeOrganizations} active · ${metrics.trialOrganizations} trial · ${metrics.suspendedOrganizations} suspended`,
      icon: Building2,
      color: 'from-blue-500 to-indigo-600',
      badge: `${metrics.activeOrganizations} Live`,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Platform Monthly Revenue (MRR)',
      value: `$${metrics.totalMrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Calculated across active subscription plans',
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Stripe Synced',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      title: 'Total Platform Clients',
      value: metrics.totalClients.toLocaleString(),
      subtitle: 'Managed across all tenant CRMs',
      icon: Users,
      color: 'from-purple-500 to-pink-600',
      badge: 'CRM Volume',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      title: 'Total Projects',
      value: metrics.totalProjects.toLocaleString(),
      subtitle: 'Active & completed tenant projects',
      icon: Briefcase,
      color: 'from-amber-500 to-orange-600',
      badge: 'PM Activity',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      title: 'Communication Hub Volume',
      value: metrics.totalMessages.toLocaleString(),
      subtitle: 'Unified messages (Email, Slack, WhatsApp)',
      icon: MessageSquare,
      color: 'from-cyan-500 to-blue-600',
      badge: 'Hub Activity',
      badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs hover:border-border/80 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${card.color} text-white shadow-xs`}> {/* intentional: white icon on brand gradient background */}
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight text-foreground font-mono">
                  {card.value}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>

              <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                {card.subtitle}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
