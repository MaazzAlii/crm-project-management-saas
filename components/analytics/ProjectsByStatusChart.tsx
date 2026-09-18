import { FolderGit2 } from 'lucide-react'
import { ProjectStatusMetric } from '@/lib/analytics/data'

interface ProjectsByStatusChartProps {
  statuses: ProjectStatusMetric[]
  totalProjects: number
}

export function ProjectsByStatusChart({
  statuses,
  totalProjects,
}: ProjectsByStatusChartProps) {
  // SVG Donut chart calculation
  const radius = 64
  const strokeWidth = 18
  const circumference = 2 * Math.PI * radius

  let accumulatedOffset = 0

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Projects by Status</h2>
            <p className="text-xs text-slate-400">
              Lifecycle distribution across agency projects
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {totalProjects} Total
        </span>
      </div>

      {totalProjects === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          No projects recorded for this period.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
          {/* SVG Donut Chart */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg
              className="h-44 w-44 -rotate-90 transform"
              viewBox="0 0 160 160"
            >
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-950"
                strokeWidth={strokeWidth}
                fill="none"
              />

              {/* Status segments */}
              {statuses.map((s) => {
                const strokeDasharray = `${(s.percentage / 100) * circumference} ${circumference}`
                const strokeDashoffset = -accumulatedOffset
                accumulatedOffset += (s.percentage / 100) * circumference

                if (s.count === 0) return null

                return (
                  <circle
                    key={s.status}
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={s.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                    fill="none"
                    className="transition-all duration-500 hover:opacity-80"
                  />
                )
              })}
            </svg>

            {/* Centered Total Indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white">{totalProjects}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Projects
              </span>
            </div>
          </div>

          {/* Status Breakdown Legend & Percentages */}
          <div className="flex-1 w-full space-y-2.5">
            {statuses.map((s) => (
              <div
                key={s.status}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="font-semibold text-slate-200">{s.label}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400">{s.percentage}%</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 min-w-[28px] text-center">
                    {s.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
