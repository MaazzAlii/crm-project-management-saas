'use client'

import { useState } from 'react'
import { Search, Filter, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react'

export interface ProjectFiltersState {
  search: string
  status: string
  client: string
  assigned: string
}

export interface ProjectFiltersProps {
  filters: ProjectFiltersState
  onChange: (filters: ProjectFiltersState) => void
  onReset: () => void
  totalCount: number
  filteredCount: number
  clientsList: { id: string; name: string }[]
  membersList: { id: string; name: string }[]
}

export const PROJECT_STATUS_OPTIONS = [
  { value: 'Planning', label: 'Planning' },
  { value: 'Active', label: 'Active' },
  { value: 'In Review', label: 'In Review' },
  { value: 'Completed', label: 'Completed' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Archived', label: 'Archived' },
]

export function ProjectFilters({
  filters,
  onChange,
  onReset,
  totalCount,
  filteredCount,
  clientsList,
  membersList,
}: ProjectFiltersProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)

  const activeCount = [filters.status, filters.client, filters.assigned, filters.search ? 's' : ''].filter(
    Boolean
  ).length

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md space-y-3 shadow-md">
      {/* Top Search & Count Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search projects by title, description, or client..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Count & Mobile Filter Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <button
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="sm:hidden flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300"
          >
            <Filter className="h-3.5 w-3.5 text-sky-400" />
            <span>Filter</span>
            {activeCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] text-white">
                {activeCount}
              </span>
            )}
            {isMobileExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <span className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredCount}</strong> of {totalCount} projects
          </span>
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/60 ${
          isMobileExpanded ? 'block' : 'hidden sm:grid'
        }`}
      >
        {/* Status Dropdown */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {PROJECT_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Client Dropdown */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Client
          </label>
          <select
            value={filters.client}
            onChange={(e) => onChange({ ...filters, client: e.target.value })}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="">All Clients</option>
            {clientsList.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Team Member Dropdown */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Assigned Member
          </label>
          <select
            value={filters.assigned}
            onChange={(e) => onChange({ ...filters, assigned: e.target.value })}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="">All Assignees</option>
            {membersList.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Action */}
        <div className="flex items-end">
          {activeCount > 0 ? (
            <button
              onClick={onReset}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 italic py-2 px-1 hidden sm:block">
              No active filters
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
