import { CheckCircle2, TrendingUp, Award } from 'lucide-react'
import { MonthlyVelocityItem } from '@/lib/analytics/data'

interface MonthlyCompletionRateCardProps {
  velocity: MonthlyVelocityItem[]
  completionRate: number
}

export function MonthlyCompletionRateCard({
  velocity,
  completionRate,
}: MonthlyCompletionRateCardProps) {
  // Find highest monthly closed volume for SVG chart scaling
  const maxVolume = Math.max(...velocity.map((v) => v.totalClosed), 4)

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Monthly Delivery Velocity</h2>
            <p className="text-xs text-slate-400">
              Completed deliverables & delivered projects (trailing 6 months)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Overall Rate:</span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {completionRate}% Completed
          </span>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="space-y-4">
        <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 px-2">
          {velocity.map((item, idx) => {
            const heightPercent = Math.max(Math.round((item.totalClosed / maxVolume) * 100), 8)

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
              >
                {/* Count tooltip on hover */}
                <span className="text-[10px] font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.totalClosed}
                </span>

                {/* Stacked or Gradient Bar */}
                <div className="w-full max-w-[42px] bg-slate-950 rounded-xl overflow-hidden flex flex-col justify-end p-0.5 border border-slate-800 group-hover:border-cyan-500/50 transition">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full rounded-lg bg-gradient-to-t from-cyan-600 to-indigo-500 group-hover:from-cyan-500 group-hover:to-indigo-400 transition-all duration-300"
                  />
                </div>

                {/* Month Label */}
                <span className="text-[11px] font-semibold text-slate-400 group-hover:text-white transition">
                  {item.monthShort}
                </span>
              </div>
            )
          })}
        </div>

        {/* Breakdown details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="text-slate-400">Total Closed Items</span>
            <div className="text-lg font-black text-white mt-1">
              {velocity.reduce((sum, v) => sum + v.totalClosed, 0)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="text-slate-400">Delivered Projects</span>
            <div className="text-lg font-black text-white mt-1">
              {velocity.reduce((sum, v) => sum + v.deliveredProjects, 0)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs col-span-2 sm:col-span-1">
            <span className="text-slate-400">Approved Deliverables</span>
            <div className="text-lg font-black text-white mt-1">
              {velocity.reduce((sum, v) => sum + v.completedDeliverables, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
