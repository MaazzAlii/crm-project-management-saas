'use client'

import Link from 'next/link'
import {
  Users,
  Briefcase,
  FolderKanban,
  HardDrive,
  Radio,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import type { OrganizationPlanUsage, PlanUsageMetric } from '@/lib/billing/plan-limits'

interface PlanUsageCardProps {
  usage: OrganizationPlanUsage
  showUpgradeButton?: boolean
  compact?: boolean
}

export function PlanUsageCard({
  usage,
  showUpgradeButton = true,
  compact = false,
}: PlanUsageCardProps) {
  const { planName, status, renewsAt, priceMonthly, metrics, hasWarnings, highestProximityPercent } =
    usage

  const metricList: (PlanUsageMetric & { icon: React.ReactNode })[] = [
    {
      ...metrics.teamMembers,
      icon: <Users className="w-4 h-4 text-blue-400" />,
    },
    {
      ...metrics.clients,
      icon: <Briefcase className="w-4 h-4 text-indigo-400" />,
    },
    {
      ...metrics.projects,
      icon: <FolderKanban className="w-4 h-4 text-emerald-400" />,
    },
    {
      ...metrics.storage,
      icon: <HardDrive className="w-4 h-4 text-cyan-400" />,
    },
    {
      ...metrics.channels,
      icon: <Radio className="w-4 h-4 text-purple-400" />,
    },
    {
      ...metrics.aiUsage,
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    },
  ]

  const getStatusColor = (status: PlanUsageMetric['status']) => {
    switch (status) {
      case 'exceeded':
      case 'critical':
        return {
          bar: 'bg-rose-500',
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          text: 'text-rose-400',
        }
      case 'warning':
        return {
          bar: 'bg-amber-500',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          text: 'text-amber-400',
        }
      case 'normal':
      default:
        return {
          bar: 'bg-emerald-500',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          text: 'text-slate-300',
        }
    }
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Subscription Tier & Quotas
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              <span>{status}</span>
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <h3 className="text-2xl font-black text-white">{planName}</h3>
            <span className="text-xs text-slate-400">
              ${priceMonthly}/mo {renewsAt && `• Renews ${renewsAt}`}
            </span>
          </div>
        </div>

        {showUpgradeButton && (
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Manage Plan & Limits</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Proximity Warning Banner */}
      {hasWarnings && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            highestProximityPercent >= 95
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              highestProximityPercent >= 95 ? 'text-rose-400' : 'text-amber-400'
            }`}
          />
          <div className="text-xs space-y-1 flex-1">
            <p className="font-bold text-sm text-white">
              {highestProximityPercent >= 95
                ? 'Approaching Critical Plan Capacity Limit'
                : 'Plan Usage Proximity Notice'}
            </p>
            <p className="opacity-90">
              Your organization has reached{' '}
              <span className="font-bold underline">{highestProximityPercent}%</span> capacity on one
              or more plan resources. Upgrade your tier to ensure uninterrupted team workflow.
            </p>
          </div>
          <Link
            href="/settings/billing"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap self-center ${
              highestProximityPercent >= 95
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'
                : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
            }`}
          >
            Upgrade Tier
          </Link>
        </div>
      )}

      {/* Resource Quota Progress Bars */}
      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
        {metricList.map((m) => {
          const colors = getStatusColor(m.status)
          const isUnlimited = m.max <= 0

          return (
            <div
              key={m.key}
              className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  {m.icon}
                  {m.label}
                </span>
                <span className="font-mono font-bold text-white">
                  {m.current}
                  {m.unit ? ` ${m.unit}` : ''} / {isUnlimited ? '∞' : `${m.max}${m.unit ? ` ${m.unit}` : ''}`}
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                  style={{ width: isUnlimited ? '15%' : `${m.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{isUnlimited ? 'Unlimited' : `${m.percentage}% utilized`}</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-semibold text-[10px] border ${colors.badge}`}
                >
                  {m.status === 'exceeded'
                    ? 'Limit Reached'
                    : m.status === 'critical'
                    ? 'Critical'
                    : m.status === 'warning'
                    ? 'Near Limit'
                    : 'Healthy'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
