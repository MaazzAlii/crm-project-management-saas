'use client'

import { useState } from 'react'
import { Search, Filter, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react'

export interface ClientFiltersState {
  search: string
  status: string
  platform: string
  country: string
  communicationMode: string
  tag: string
}

export interface ClientFiltersProps {
  filters: ClientFiltersState
  onChange: (newFilters: ClientFiltersState) => void
  onReset: () => void
  totalCount: number
  filteredCount: number
  countriesList: string[]
  tagsList?: string[]
}

export const PLATFORMS = ['WhatsApp', 'Slack', 'Upwork', 'Discord', 'Email', 'Other']
export const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

export function ClientFilters({
  filters,
  onChange,
  onReset,
  totalCount,
  filteredCount,
  countriesList,
  tagsList = [],
}: ClientFiltersProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)

  const activeFilterCount = [
    filters.status,
    filters.platform,
    filters.country,
    filters.communicationMode,
    filters.tag,
    filters.search ? 'search' : '',
  ].filter(Boolean).length

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value })
  }

  const handleSelectChange = (key: keyof ClientFiltersState, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-md space-y-3 shadow-xs">
      {/* Search Input Bar + Mobile Toggle Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search clients by name, company, or email..."
            className="w-full rounded-xl border border-border bg-background pl-10 pr-9 py-2.5 text-xs text-foreground placeholder:text-placeholder focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle & Quick Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <button
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="flex sm:hidden items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition"
          >
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
            {isMobileExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
            )}
          </button>

          <span className="text-xs text-muted-foreground hidden sm:inline">
            Showing <strong className="text-foreground">{filteredCount}</strong> of {totalCount} clients
          </span>
        </div>
      </div>

      {/* Filter Dropdowns Controls — Desktop Always Visible, Mobile Collapsible */}
      <div
        className={`grid grid-cols-1 gap-2.5 pt-2 border-t border-border sm:grid-cols-4 lg:grid-cols-5 ${
          isMobileExpanded ? 'block' : 'hidden sm:grid'
        }`}
      >
        {/* Status Dropdown */}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleSelectChange('status', e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Platform Dropdown */}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Platform
          </label>
          <select
            value={filters.platform}
            onChange={(e) => handleSelectChange('platform', e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
          >
            <option value="">All Platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Communication Mode Dropdown */}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Communication Mode
          </label>
          <select
            value={filters.communicationMode}
            onChange={(e) => handleSelectChange('communicationMode', e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
          >
            <option value="">All Modes</option>
            <option value="manual">Manual (Hand-logged)</option>
            <option value="connected">Connected (Auto-synced)</option>
          </select>
        </div>

        {/* Country Dropdown */}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Country
          </label>
          <select
            value={filters.country}
            onChange={(e) => handleSelectChange('country', e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
          >
            <option value="">All Countries</option>
            {countriesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Dropdown */}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Client Tag
          </label>
          <select
            value={filters.tag}
            onChange={(e) => handleSelectChange('tag', e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
          >
            <option value="">All Tags</option>
            {tagsList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          {activeFilterCount > 0 ? (
            <button
              onClick={onReset}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset ({activeFilterCount})</span>
            </button>
          ) : (
            <div className="text-[11px] text-muted-foreground italic py-2 px-1 hidden sm:block">
              No active filters
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
