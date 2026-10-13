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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4 shadow-inner">
          <FilterX className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">No matching clients</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          No client entries match your current search query or applied filter criteria.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/80 transition"
          >
            Clear Active Filters
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4 shadow-sm">
        <Users className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-1">No clients added yet</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        Start building your CRM database by adding your first client. Track communication mode, contact info, status, and linked workspace channels.
      </p>
      <Link
        href="/clients/new"
        className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus className="h-4 w-4 stroke-[2.5]" />
        <span>Add Your First Client</span>
      </Link>
    </div>
  )
}
