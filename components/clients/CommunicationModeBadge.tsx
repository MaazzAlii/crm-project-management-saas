'use client'

import { Pencil, Zap } from 'lucide-react'

export interface CommunicationModeBadgeProps {
  mode?: 'manual' | 'connected' | string | null
  className?: string
  onUpgrade?: () => void
}

export function CommunicationModeBadge({
  mode = 'manual',
  className = '',
  onUpgrade,
}: CommunicationModeBadgeProps) {
  const isConnected = mode === 'connected'

  if (isConnected) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 shadow-sm ${className}`}
        title="Connected Hub: Auto-syncs conversations from linked channels into unified inbox"
      >
        <Zap className="h-3 w-3 text-emerald-400 fill-emerald-400/20" />
        <span>Connected</span>
      </span>
    )
  }

  if (onUpgrade) {
    return (
      <button
        type="button"
        onClick={onUpgrade}
        className={`inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-800/80 px-2.5 py-0.5 text-xs font-semibold text-slate-300 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300 transition shadow-sm cursor-pointer group ${className}`}
        title="Manual Mode: Click to upgrade to Connected Hub auto-sync"
      >
        <Pencil className="h-3 w-3 text-slate-400 group-hover:text-emerald-400 transition" />
        <span>Manual</span>
        <span className="text-[10px] text-emerald-400 font-bold ml-0.5 opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
          <Zap className="h-2.5 w-2.5" /> Upgrade
        </span>
      </button>
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
