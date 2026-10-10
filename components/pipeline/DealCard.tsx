'use client';

import React from 'react';
import { Deal, PipelineLabel } from '@/lib/types/pipeline';
import { CheckSquare, MessageSquare, Calendar, Building2, User, CheckCircle2, XCircle } from 'lucide-react';

interface DealCardProps {
  deal: Deal;
  stageColor?: string;
  onClick?: (deal: Deal) => void;
  isDragging?: boolean;
}

export function DealCard({ deal, stageColor = '#6366f1', onClick, isDragging = false }: DealCardProps) {
  // Format currency
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: deal.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(deal.value || 0);

  // Close date badge color
  const getCloseDateStatus = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Overdue', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    if (diffDays <= 7) return { label: `${diffDays}d left`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return {
      label: new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      color: 'text-slate-400 bg-slate-800/60 border-slate-700/50',
    };
  };

  const closeDateInfo = getCloseDateStatus(deal.expected_close_date);

  // Labels
  const labels: PipelineLabel[] = deal.labels || [];
  const visibleLabels = labels.slice(0, 4);
  const extraLabelsCount = Math.max(0, labels.length - 4);

  // Owner Initials
  const ownerInitials = (deal.contact_name || deal.company_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isWon = deal.status === 'won';
  const isLost = deal.status === 'lost';

  return (
    <div
      onClick={() => onClick?.(deal)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(deal);
        }
      }}
      className={`group relative flex flex-col rounded-xl border p-3.5 transition-all duration-150 cursor-pointer select-none text-left ${
        isDragging
          ? 'opacity-40 scale-95 border-sky-500/50 shadow-2xl bg-slate-800/80'
          : isWon
          ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/50 hover:-translate-y-0.5'
          : isLost
          ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-950/50 hover:-translate-y-0.5'
          : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700 hover:bg-slate-850 hover:shadow-md hover:shadow-black/40 hover:-translate-y-0.5'
      }`}
    >
      {/* Top row: Labels */}
      {labels.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {visibleLabels.map((lbl) => (
            <span
              key={lbl.id}
              title={lbl.name}
              className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold transition"
              style={{
                backgroundColor: `${lbl.color}20`,
                color: lbl.color,
                border: `1px solid ${lbl.color}40`,
              }}
            >
              {lbl.name}
            </span>
          ))}
          {extraLabelsCount > 0 && (
            <span className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              +{extraLabelsCount}
            </span>
          )}
        </div>
      )}

      {/* Deal Title */}
      <h4 className="line-clamp-2 text-sm font-semibold text-slate-100 group-hover:text-white leading-snug">
        {deal.title}
      </h4>

      {/* Company / Client Subtitle */}
      {(deal.company_name || deal.contact_name) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
          <Building2 className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
          <span className="truncate">{deal.company_name || deal.contact_name}</span>
        </div>
      )}

      {/* Badges / Value / Metadata Row */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
        <div className="flex items-center gap-2">
          {/* Value */}
          <span className="text-xs font-bold text-sky-400 font-mono tracking-tight">
            {formattedValue}
          </span>

          {/* Status badge if closed */}
          {isWon && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" /> Won
            </span>
          )}
          {isLost && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
              <XCircle className="h-3 w-3" /> Lost
            </span>
          )}
        </div>

        {/* Indicators on right */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          {/* Close date */}
          {closeDateInfo && !isWon && !isLost && (
            <span
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 border text-[10px] font-medium ${closeDateInfo.color}`}
            >
              <Calendar className="h-3 w-3" />
              {closeDateInfo.label}
            </span>
          )}

          {/* Checklist progress */}
          {(deal.checklist_total_count || 0) > 0 && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                deal.checklist_done_count === deal.checklist_total_count
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              <CheckSquare className="h-3 w-3" />
              {deal.checklist_done_count}/{deal.checklist_total_count}
            </span>
          )}

          {/* Comments count */}
          {(deal.comments_count || 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <MessageSquare className="h-3 w-3" />
              {deal.comments_count}
            </span>
          )}

          {/* Owner Avatar / Initials */}
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-300"
            title={deal.contact_name || 'Owner'}
          >
            {ownerInitials}
          </div>
        </div>
      </div>

      {/* Probability bottom edge indicator */}
      {!isWon && !isLost && deal.probability !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-xl bg-slate-800">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${deal.probability}%`,
              backgroundColor: stageColor,
            }}
          />
        </div>
      )}
    </div>
  );
}
