'use client';

import React, { useState } from 'react';
import { DealFilters, PipelineLabel } from '@/lib/types/pipeline';
import {
  Search,
  Filter,
  X,
  User,
  Tag,
  DollarSign,
  Calendar,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';

interface PipelineFilterBarProps {
  filters: DealFilters;
  labels: PipelineLabel[];
  currentUserId?: string;
  onFilterChange: (filters: DealFilters) => void;
  onSearchChange: (q: string) => void;
  searchQuery: string;
}

export function PipelineFilterBar({
  filters,
  labels,
  currentUserId,
  onFilterChange,
  onSearchChange,
  searchQuery,
}: PipelineFilterBarProps) {
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  const isMyDealsActive = filters.ownerId === currentUserId;

  const handleToggleMyDeals = () => {
    if (isMyDealsActive) {
      const next = { ...filters };
      delete next.ownerId;
      onFilterChange(next);
    } else if (currentUserId) {
      onFilterChange({ ...filters, ownerId: currentUserId });
    }
  };

  const handleClearAll = () => {
    onFilterChange({});
    onSearchChange('');
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    filters.ownerId ||
    filters.labelId ||
    filters.minValue !== undefined ||
    filters.maxValue !== undefined ||
    filters.status ||
    filters.closeBefore ||
    filters.closeAfter;

  return (
    <div className="flex flex-col gap-2.5 px-4 py-2 border-b border-slate-800/80 bg-slate-950/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search deals, clients, companies..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action buttons & Quick Toggles */}
        <div className="flex items-center gap-2">
          {/* My Deals toggle */}
          {currentUserId && (
            <button
              onClick={handleToggleMyDeals}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                isMyDealsActive
                  ? 'border-sky-500/50 bg-sky-500/15 text-sky-300'
                  : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>My Deals</span>
            </button>
          )}

          {/* Filter Popover Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                hasActiveFilters
                  ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                  : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>

            {/* Filter Popover Content */}
            {showFilterPopover && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl z-30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white">Filter Deals</span>
                  <button
                    onClick={() => setShowFilterPopover(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Status selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        status: (e.target.value as any) || undefined,
                      })
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">All Open Deals</option>
                    <option value="won">Won Deals</option>
                    <option value="lost">Lost Deals</option>
                    <option value="archived">Archived Deals</option>
                  </select>
                </div>

                {/* Label selector */}
                {labels.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Label</label>
                    <select
                      value={filters.labelId || ''}
                      onChange={(e) =>
                        onFilterChange({
                          ...filters,
                          labelId: e.target.value || undefined,
                        })
                      }
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="">Any Label</option>
                      {labels.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Min / Max value */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Value Range ($)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minValue ?? ''}
                      onChange={(e) =>
                        onFilterChange({
                          ...filters,
                          minValue: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      className="w-1/2 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxValue ?? ''}
                      onChange={(e) =>
                        onFilterChange({
                          ...filters,
                          maxValue: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      className="w-1/2 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilterPopover(false)}
                    className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-bold text-white hover:bg-sky-500"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reset All */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              title="Clear all filters"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
              Search: &quot;{searchQuery}&quot;
              <X
                className="h-3 w-3 cursor-pointer hover:text-white"
                onClick={() => onSearchChange('')}
              />
            </span>
          )}
          {filters.ownerId && (
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[11px] text-sky-300">
              Owner: {isMyDealsActive ? 'Me' : 'Filtered'}
              <X
                className="h-3 w-3 cursor-pointer hover:text-white"
                onClick={() => {
                  const n = { ...filters };
                  delete n.ownerId;
                  onFilterChange(n);
                }}
              />
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[11px] text-purple-300 uppercase">
              {filters.status}
              <X
                className="h-3 w-3 cursor-pointer hover:text-white"
                onClick={() => {
                  const n = { ...filters };
                  delete n.status;
                  onFilterChange(n);
                }}
              />
            </span>
          )}
          {filters.labelId && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
              Label: {labels.find((l) => l.id === filters.labelId)?.name || 'Active'}
              <X
                className="h-3 w-3 cursor-pointer hover:text-white"
                onClick={() => {
                  const n = { ...filters };
                  delete n.labelId;
                  onFilterChange(n);
                }}
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
