'use client';

import React, { useState } from 'react';
import { Pipeline } from '@/lib/types/pipeline';
import {
  Kanban,
  Table,
  TrendingUp,
  Plus,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PipelineHeaderProps {
  pipelines: Pipeline[];
  activePipeline: Pipeline | null;
  activeView: 'board' | 'table' | 'forecast';
  onSelectPipeline: (pipelineId: string) => void;
  onSelectView: (view: 'board' | 'table' | 'forecast') => void;
  onOpenNewDeal: () => void;
  onOpenManagePipelines: () => void;
  totalDealsCount: number;
  totalPipelineValue: number;
}

export function PipelineHeader({
  pipelines,
  activePipeline,
  activeView,
  onSelectPipeline,
  onSelectView,
  onOpenNewDeal,
  onOpenManagePipelines,
  totalDealsCount,
  totalPipelineValue,
}: PipelineHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(totalPipelineValue || 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/80 px-6 py-3.5 backdrop-blur-md">
      {/* Left: Pipeline Switcher Dropdown */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-sm font-bold text-white hover:border-slate-700 hover:bg-slate-800 transition"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <span>{activePipeline?.name || 'Sales Pipeline'}</span>
            <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
          </button>

          {showDropdown && (
            <div className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-40 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Pipeline
              </div>
              {pipelines.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPipeline(p.id);
                    setShowDropdown(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    p.id === activePipeline?.id
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {p.is_default && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">
                      Default
                    </span>
                  )}
                </button>
              ))}

              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onOpenManagePipelines();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                >
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  <span>Manage Pipelines...</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Total Summary */}
        <div className="hidden sm:flex items-center gap-3 border-l border-slate-800 pl-4 text-xs">
          <div>
            <span className="text-slate-400">Open Value: </span>
            <span className="font-bold font-mono text-sky-400">{formattedTotal}</span>
          </div>
          <div>
            <span className="text-slate-400">Deals: </span>
            <span className="font-bold text-slate-200">{totalDealsCount}</span>
          </div>
        </div>
      </div>

      {/* Right: View Toggles & New Deal Button */}
      <div className="flex items-center gap-3">
        {/* View Switcher Toggle */}
        <div className="flex rounded-xl border border-slate-800 bg-slate-900/90 p-1">
          <button
            onClick={() => onSelectView('board')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeView === 'board'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Board</span>
          </button>
          <button
            onClick={() => onSelectView('table')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeView === 'table'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Table</span>
          </button>
          <button
            onClick={() => onSelectView('forecast')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeView === 'forecast'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Forecast</span>
          </button>
        </div>

        {/* New Deal Button */}
        <button
          onClick={onOpenNewDeal}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:brightness-110 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Deal</span>
        </button>
      </div>
    </div>
  );
}
