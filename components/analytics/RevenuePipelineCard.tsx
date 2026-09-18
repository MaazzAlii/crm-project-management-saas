import { DollarSign, TrendingUp, CreditCard, Briefcase } from 'lucide-react'
import { RevenuePipelineStats } from '@/lib/analytics/data'

interface RevenuePipelineCardProps {
  stats: RevenuePipelineStats
}

export function RevenuePipelineCard({ stats }: RevenuePipelineCardProps) {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Revenue Pipeline & Value</h2>
            <p className="text-xs text-slate-400">
              Active project budgets and realized billings
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {stats.activeProjectsCount} Active Projects
        </span>
      </div>

      {/* Top 3 Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Pipeline Value */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>Active Pipeline</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-white">
            {currencyFormatter.format(stats.totalActiveValue)}
          </div>
          <p className="text-[11px] text-slate-400">
            Across planning, in-progress, review, and delivered
          </p>
        </div>

        {/* Realized / Invoiced */}
        <div className="rounded-2xl border border-teal-500/20 bg-teal-950/20 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-teal-400 font-semibold">
            <span>Invoiced / Billed</span>
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-white">
            {currencyFormatter.format(stats.totalInvoicedValue + stats.totalPaidValue)}
          </div>
          <p className="text-[11px] text-slate-400">
            Paid: {currencyFormatter.format(stats.totalPaidValue)} | Invoiced: {currencyFormatter.format(stats.totalInvoicedValue)}
          </p>
        </div>

        {/* Average Project Budget */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Average Project Value</span>
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-white">
            {currencyFormatter.format(stats.averageProjectBudget)}
          </div>
          <p className="text-[11px] text-slate-400">
            Based on active project budgets
          </p>
        </div>
      </div>

      {/* Stage Breakdown Bar */}
      {stats.byStage.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Pipeline Value by Lifecycle Stage</span>
            <span className="text-slate-500 text-[11px]">
              Total Value: {currencyFormatter.format(stats.totalHistoricalValue)}
            </span>
          </div>

          {/* Multi-segment progress bar */}
          <div className="h-3 w-full rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
            {stats.byStage.map((s) => {
              const pct = stats.totalHistoricalValue > 0
                ? (s.totalValue / stats.totalHistoricalValue) * 100
                : 0
              if (pct === 0) return null
              return (
                <div
                  key={s.stage}
                  style={{ width: `${pct}%`, backgroundColor: s.color }}
                  title={`${s.label}: ${currencyFormatter.format(s.totalValue)} (${Math.round(pct)}%)`}
                  className="h-full transition-all duration-300 hover:opacity-80"
                />
              )
            })}
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {stats.byStage.map((s) => (
              <div
                key={s.stage}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-slate-300 font-medium truncate max-w-[80px]">
                    {s.label}
                  </span>
                </div>
                <span className="font-bold text-white text-[11px]">
                  {currencyFormatter.format(s.totalValue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
