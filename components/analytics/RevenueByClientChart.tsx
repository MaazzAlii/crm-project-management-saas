'use client'

import { DollarSign, Layers, PieChart } from 'lucide-react'
import type { RevenueByClientMetric, RevenueByProjectTypeMetric } from '@/lib/analytics/data'

interface RevenueByClientChartProps {
  clients: RevenueByClientMetric[]
  projectTypes: RevenueByProjectTypeMetric[]
  totalRevenue: number
}

export function RevenueByClientChart({
  clients,
  projectTypes,
  totalRevenue,
}: RevenueByClientChartProps) {
  const topClients = clients.slice(0, 5)
  const maxClientRevenue = Math.max(...topClients.map((c) => c.totalBilled), 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Top Clients by Revenue */}
      <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span>Top Revenue Contributing Clients</span>
            </h3>
            <p className="text-xs text-slate-400">
              Leading accounts by cumulative contracted and invoiced budget.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Top 5 Accounts</span>
        </div>

        <div className="space-y-4">
          {topClients.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No client revenue recorded yet.</p>
          ) : (
            topClients.map((c, index) => {
              const percentage = Math.round((c.totalBilled / maxClientRevenue) * 100)
              const shareOfTotal = totalRevenue > 0 ? Math.round((c.totalBilled / totalRevenue) * 100) : 0

              return (
                <div key={c.clientId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <span className="w-4 text-slate-500 font-mono text-[10px]">#{index + 1}</span>
                      {c.clientName}
                      {c.company && (
                        <span className="text-[11px] text-slate-400 font-normal">({c.company})</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-emerald-400 font-bold">${c.totalBilled.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500">({shareOfTotal}%)</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800/80">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Revenue by Project Type */}
      <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Revenue by Project Type</span>
          </h3>
          <p className="text-xs text-slate-400">Distribution across agency service offerings.</p>
        </div>

        <div className="space-y-3">
          {projectTypes.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No project categorization data.</p>
          ) : (
            projectTypes.map((pt) => (
              <div
                key={pt.projectType}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{pt.projectType}</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ${pt.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{pt.projectsCount} projects</span>
                  <span>{pt.percentage}% of revenue</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pt.percentage}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
