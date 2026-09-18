import { Users, AlertCircle, CheckCircle2, User } from 'lucide-react'
import { TeamWorkloadMember } from '@/lib/analytics/data'

interface TeamWorkloadCardProps {
  workload: TeamWorkloadMember[]
}

export function TeamWorkloadCard({ workload }: TeamWorkloadCardProps) {
  const getStatusBadge = (status: 'optimal' | 'heavy' | 'light') => {
    switch (status) {
      case 'heavy':
        return {
          label: 'Heavy Load',
          style: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
          barColor: 'bg-rose-500',
        }
      case 'optimal':
        return {
          label: 'Optimal',
          style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
          barColor: 'bg-emerald-500',
        }
      case 'light':
        return {
          label: 'Available',
          style: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
          barColor: 'bg-sky-500',
        }
    }
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Team Workload Distribution</h2>
            <p className="text-xs text-slate-400">
              Active assigned tasks and member capacity
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {workload.length} Members
        </span>
      </div>

      {workload.length === 0 ? (
        <div className="py-10 text-center text-slate-500 text-xs">
          No team members registered yet.
        </div>
      ) : (
        <div className="space-y-3.5">
          {workload.map((member) => {
            const badge = getStatusBadge(member.loadStatus)

            return (
              <div
                key={member.userId}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition space-y-2.5"
              >
                {/* Member Meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 overflow-hidden">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white leading-none">
                          {member.name}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                          {member.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {member.activeTasksCount} active tasks • {member.completedTasksCount} completed
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.style}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Task Capacity</span>
                    <span className="font-semibold text-slate-200">
                      {member.capacityPercentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${member.capacityPercentage}%` }}
                      className={`h-full transition-all duration-300 ${badge.barColor}`}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
