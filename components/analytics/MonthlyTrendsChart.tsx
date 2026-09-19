'use client'

import { TrendingUp, DollarSign, Users, FolderKanban } from 'lucide-react'
import type { MonthlyTrendMetric } from '@/lib/analytics/data'

interface MonthlyTrendsChartProps {
  trends: MonthlyTrendMetric[]
}

export function MonthlyTrendsChart({ trends }: MonthlyTrendsChartProps) {
  const maxRevenue = Math.max(...trends.map((t) => t.deliveredRevenue + t.invoicedRevenue), 1000)
  const maxProjects = Math.max(...trends.map((t) => t.activeProjects), 5)

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Monthly Financial & Operational Trends</span>
          </h3>
          <p className="text-xs text-slate-400">
            Historical revenue velocity, active project workload, and closed tasks (Trailing 6 Months).
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-slate-300">Delivered ($)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-teal-500" />
            <span className="text-slate-300">Invoiced ($)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500" />
            <span className="text-slate-300">Active Projects</span>
          </div>
        </div>
      </div>

      {/* SVG Multi-Bar & Trend Chart */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {trends.map((t) => {
          const totalMonthRevenue = t.deliveredRevenue + t.invoicedRevenue
          const revenueHeightPercent = Math.min(
            Math.round((totalMonthRevenue / maxRevenue) * 100),
            100
          )
          const deliveredPercent =
            totalMonthRevenue > 0
              ? Math.round((t.deliveredRevenue / totalMonthRevenue) * 100)
              : 0

          return (
            <div
              key={t.month}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
            >
              {/* Month Header */}
              <div className="text-center border-b border-slate-800/60 pb-1.5">
                <span className="text-xs font-bold text-white">{t.monthShort}</span>
                <p className="text-[10px] text-slate-500">{t.year}</p>
              </div>

              {/* Bar Visual */}
              <div className="h-28 w-full flex items-end justify-center gap-1.5 px-2 bg-slate-900/40 rounded-lg py-2">
                {/* Revenue Stacked Bar */}
                <div className="w-6 bg-slate-800 rounded-t overflow-hidden flex flex-col-reverse justify-start h-full">
                  <div
                    className="w-full bg-emerald-500 transition-all duration-500"
                    style={{
                      height: `${(revenueHeightPercent * deliveredPercent) / 100}%`,
                    }}
                    title={`Delivered: $${t.deliveredRevenue.toLocaleString()}`}
                  />
                  <div
                    className="w-full bg-teal-500 transition-all duration-500"
                    style={{
                      height: `${(revenueHeightPercent * (100 - deliveredPercent)) / 100}%`,
                    }}
                    title={`Invoiced: $${t.invoicedRevenue.toLocaleString()}`}
                  />
                </div>

                {/* Projects Bar */}
                <div className="w-3 bg-slate-800 rounded-t overflow-hidden flex flex-col-reverse justify-start h-full">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all duration-500"
                    style={{
                      height: `${Math.min(Math.round((t.activeProjects / maxProjects) * 100), 100)}%`,
                    }}
                    title={`Projects: ${t.activeProjects}`}
                  />
                </div>
              </div>

              {/* Numerical Metrics */}
              <div className="space-y-1 text-[11px] font-mono text-center">
                <p className="font-bold text-white">${(totalMonthRevenue / 1000).toFixed(1)}k</p>
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                  <span className="text-blue-400">{t.activeProjects} proj</span>
                  <span className="text-purple-400">{t.closedTasks} tasks</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
