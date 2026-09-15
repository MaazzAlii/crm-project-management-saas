'use client'

import { Clock, Play, Eye, CheckCircle2, PauseCircle, Archive } from 'lucide-react'

export interface ProjectStatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export function ProjectStatusBadge({ status, size = 'sm' }: ProjectStatusBadgeProps) {
  const norm = status.toLowerCase()

  let style = 'bg-slate-800 text-slate-400 border-slate-700'
  let label = status
  let Icon = Clock

  if (norm === 'planning' || norm === 'brief_received') {
    style = 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    label = 'Planning'
    Icon = Clock
  } else if (norm === 'active' || norm === 'in_progress') {
    style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    label = 'Active'
    Icon = Play
  } else if (norm === 'in review' || norm === 'in_review' || norm === 'review') {
    style = 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    label = 'In Review'
    Icon = Eye
  } else if (norm === 'completed' || norm === 'delivered' || norm === 'paid' || norm === 'invoiced') {
    style = 'bg-sky-500/10 text-sky-400 border-sky-500/30'
    label = 'Completed'
    Icon = CheckCircle2
  } else if (norm === 'on hold' || norm === 'on_hold') {
    style = 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    label = 'On Hold'
    Icon = PauseCircle
  } else if (norm === 'archived') {
    style = 'bg-slate-800 text-slate-400 border-slate-700'
    label = 'Archived'
    Icon = Archive
  }

  const sizeClass = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${style} ${sizeClass}`}>
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </span>
  )
}
