'use client'

import Link from 'next/link'
import { Users, Plus, FilterX } from 'lucide-react'

export interface EmptyStateProps {
  isFiltered?: boolean
  onClearFilters?: () => void
}

export function EmptyState({ isFiltered = false, onClearFilters }: EmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 mb-4 shadow-inner">
          <FilterX className="h-7 w-7 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">No matching clients</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          No client entries match your current search query or applied filter criteria.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Clear Active Filters
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/30 text-sky-400 mb-4 shadow-lg shadow-sky-500/10">
        <Users className="h-8 w-8 text-sky-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-1">No clients added yet</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        Start building your CRM database by adding your first client. Track communication mode, contact info, status, and linked workspace channels.
      </p>
      <Link
        href="/clients/new"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/25 hover:from-sky-400 hover:to-blue-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus className="h-4 w-4 stroke-[2.5]" />
        <span>Add Your First Client</span>
      </Link>
    </div>
  )
}
