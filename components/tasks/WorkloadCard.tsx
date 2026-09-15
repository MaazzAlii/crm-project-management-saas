'use client'

import { useState } from 'react'
import {
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Briefcase
} from 'lucide-react'
import { TeamWorkloadRecord } from '@/app/(dashboard)/tasks/actions'

interface WorkloadCardProps {
  memberWorkload: TeamWorkloadRecord
}

export function WorkloadCard({ memberWorkload }: WorkloadCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getCapacityStyle = (level: TeamWorkloadRecord['workload_level']) => {
    switch (level) {
      case 'Light':
        return {
          badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          bar: 'bg-slate-400',
          pct: 25
        }
      case 'Optimal':
        return {
          badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          bar: 'bg-emerald-500',
          pct: 50
        }
      case 'Heavy':
        return {
          badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          bar: 'bg-amber-500',
          pct: 75
        }
      case 'Overloaded':
        return {
          badge: 'bg-red-500/10 text-red-500 border-red-500/20',
          bar: 'bg-red-500',
          pct: 100
        }
    }
  }

  const capacity = getCapacityStyle(memberWorkload.workload_level)

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm shrink-0">
            {memberWorkload.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {memberWorkload.full_name}
            </h3>
            {memberWorkload.email && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {memberWorkload.email}
              </p>
            )}
          </div>
        </div>

        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${capacity.badge}`}
        >
          {memberWorkload.workload_level} Load
        </span>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="text-xs text-slate-400 font-medium">Active</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {memberWorkload.active_tasks_count}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400 font-medium">Completed</div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {memberWorkload.done_tasks_count}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400 font-medium">Overdue</div>
          <div
            className={`text-lg font-bold mt-0.5 ${
              memberWorkload.overdue_tasks_count > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-400'
            }`}
          >
            {memberWorkload.overdue_tasks_count}
          </div>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span>Capacity Utilization</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {memberWorkload.active_tasks_count} active tasks
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${capacity.bar}`}
            style={{ width: `${capacity.pct}%` }}
          />
        </div>
      </div>

      {/* Expandable Assigned Task List */}
      {memberWorkload.assigned_tasks.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <span>Assigned Tasks ({memberWorkload.assigned_tasks.length})</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
              {memberWorkload.assigned_tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs flex items-center justify-between gap-2 border border-slate-200/50 dark:border-slate-800"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {task.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {task.project_title}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0 ${
                      task.status === 'done'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : task.status === 'in_progress'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}
                  >
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
