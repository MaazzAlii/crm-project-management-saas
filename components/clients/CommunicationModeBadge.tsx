'use client'

import { Pencil, Zap } from 'lucide-react'

export interface CommunicationModeBadgeProps {
  mode?: 'manual' | 'connected' | string | null
  className?: string
}

export function CommunicationModeBadge({ mode = 'manual', className = '' }: CommunicationModeBadgeProps) {
  const isConnected = mode === 'connected'

  if (isConnected) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 shadow-sm ${className}`}
        title="Connected: Auto-syncs conversations from linked channels"
      >
        <Zap className="h-3 w-3 text-emerald-400 fill-emerald-400/20" />
        <span>Connected</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-800/80 px-2.5 py-0.5 text-xs font-semibold text-slate-300 shadow-sm ${className}`}
      title="Manual: Team logs conversations manually"
    >
      <Pencil className="h-3 w-3 text-slate-400" />
      <span>Manual</span>
    </span>
  )
}
