'use client'

import { Search, Filter } from 'lucide-react'

interface OrgListFilterProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedPlan: string
  setSelectedPlan: (plan: string) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
}

export function OrgListFilter({
  searchTerm,
  setSearchTerm,
  selectedPlan,
  setSelectedPlan,
  selectedStatus,
  setSelectedStatus,
}: OrgListFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search organizations by name or slug..."
          className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Plan:</span>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="trialing">Trialing</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>
    </div>
  )
}
