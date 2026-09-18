'use client'

import { useState } from 'react'
import { AlertTriangle, Clock, Calendar, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { DeadlineItem } from '@/lib/analytics/data'

interface DeadlinesAndOverdueCardProps {
  overdueItems: DeadlineItem[]
  upcomingDeadlines: DeadlineItem[]
}

export function DeadlinesAndOverdueCard({
  overdueItems,
  upcomingDeadlines,
}: DeadlinesAndOverdueCardProps) {
  const [activeTab, setActiveTab] = useState<'overdue' | 'upcoming'>('overdue')

  const displayedList = activeTab === 'overdue' ? overdueItems : upcomingDeadlines

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Deadlines & Risks</h2>
            <p className="text-xs text-slate-400">
              Immediate milestones and overdue items
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-2xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'overdue'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>Overdue ({overdueItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'upcoming'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <span>Next 7 Days ({upcomingDeadlines.length})</span>
          </button>
        </div>
      </div>

      {/* List Items */}
      {displayedList.length === 0 ? (
        <div className="py-10 text-center text-slate-500 text-xs">
          {activeTab === 'overdue'
            ? '🎉 Great job! No overdue projects or tasks currently.'
            : 'No upcoming deadlines within the next 7 days.'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedList.map((item) => {
            const isOverdue = item.isOverdue
            const daysCount = Math.abs(item.daysDiff)
            const targetHref = item.type === 'project' ? `/projects/${item.id}` : '/tasks'

            return (
              <Link
                key={item.id}
                href={targetHref}
                className={`flex items-center justify-between p-3 rounded-2xl border transition group ${
                  isOverdue
                    ? 'border-rose-500/30 bg-rose-950/20 hover:border-rose-500/50'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                      isOverdue
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {isOverdue ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition">
                        {item.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.relatedName} • Due {new Date(item.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      isOverdue
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isOverdue
                      ? `${daysCount}d overdue`
                      : daysCount === 0
                      ? 'Due today'
                      : `In ${daysCount}d`}
                  </span>

                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
