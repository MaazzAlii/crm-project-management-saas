'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PipelineStage, Deal } from '@/lib/types/pipeline';
import { DealCard } from './DealCard';
import { Plus, X, AlertTriangle, ChevronRight, ChevronDown } from 'lucide-react';

interface ColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  totalValue: number;
  totalDeals: number;
  onCardClick?: (deal: Deal) => void;
  onAddCard?: (stageId: string, title: string) => Promise<void>;
  isDropTarget?: boolean;
}

// Draggable wrapper item for sortable cards
function SortableCard({
  deal,
  stageColor,
  onClick,
}: {
  deal: Deal;
  stageColor: string;
  onClick?: (deal: Deal) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: {
      type: 'Deal',
      deal,
      stageId: deal.stage_id,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard
        deal={deal}
        stageColor={stageColor}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  );
}

export function Column({
  stage,
  deals,
  totalValue,
  totalDeals,
  onCardClick,
  onAddCard,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: 'Column',
      stage,
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  const handleAddSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddCard?.(stage.id, newTitle.trim());
      setNewTitle('');
      // Scroll to bottom after adding
      setTimeout(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddSubmit();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTitle('');
    }
  };

  // Format total stage value
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(totalValue || 0);

  const isWipExceeded = stage.wip_limit && totalDeals > stage.wip_limit;
  const isWon = stage.is_won;
  const isLost = stage.is_lost;

  if (isCollapsed) {
    return (
      <div
        onClick={() => setIsCollapsed(false)}
        className="flex h-full w-12 flex-shrink-0 flex-col items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3 py-4 cursor-pointer hover:border-slate-700 hover:bg-slate-900/60 transition select-none"
      >
        <div className="flex flex-col items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: stage.color || '#6366f1' }}
          />
          <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
            {totalDeals}
          </span>
        </div>
        <div className="writing-vertical-rl transform rotate-180 text-xs font-bold text-slate-400 tracking-wider uppercase">
          {stage.name}
        </div>
        <ChevronRight className="h-4 w-4 text-slate-500" />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full w-72 flex-shrink-0 flex-col rounded-2xl border transition-colors select-none ${
        isOver
          ? 'border-sky-500/80 bg-slate-900/90 ring-2 ring-sky-500/20'
          : isWon
          ? 'border-emerald-500/30 bg-slate-950/70'
          : isLost
          ? 'border-rose-500/30 bg-slate-950/70'
          : 'border-slate-800/80 bg-slate-950/60'
      }`}
    >
      {/* Column Header */}
      <div
        className={`flex items-center justify-between border-b px-3.5 py-3 ${
          isWon
            ? 'border-emerald-500/30 bg-emerald-950/10'
            : isLost
            ? 'border-rose-500/30 bg-rose-950/10'
            : 'border-slate-800/80 bg-slate-900/50'
        } rounded-t-2xl`}
      >
        <div className="flex items-center gap-2 truncate">
          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm"
            style={{ backgroundColor: stage.color || '#6366f1' }}
          />
          <h3 className="truncate text-xs font-bold text-slate-100">{stage.name}</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
              isWipExceeded
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {totalDeals}
            {stage.wip_limit ? `/${stage.wip_limit}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-bold text-slate-400 font-mono">
            {formattedTotal}
          </span>
          <button
            onClick={() => setIsCollapsed(true)}
            title="Collapse column"
            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* WIP Limit Alert Banner if exceeded */}
      {isWipExceeded && (
        <div className="flex items-center gap-1.5 bg-rose-500/10 border-b border-rose-500/20 px-3 py-1.5 text-[10px] font-semibold text-rose-400">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          <span>WIP limit exceeded ({totalDeals} &gt; {stage.wip_limit})</span>
        </div>
      )}

      {/* Scrollable Cards Body */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[160px]">
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <SortableCard
              key={deal.id}
              deal={deal}
              stageColor={stage.color}
              onClick={onCardClick}
            />
          ))}
        </SortableContext>

        {deals.length === 0 && !isAdding && (
          <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/80 p-4 text-center">
            <p className="text-xs text-slate-500 font-medium">Drop deals here</p>
          </div>
        )}

        {/* Inline Composer */}
        {isAdding ? (
          <div className="rounded-xl border border-sky-500/50 bg-slate-900 p-2.5 shadow-xl animate-in fade-in duration-150">
            <textarea
              ref={textareaRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a title for this deal..."
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={() => handleAddSubmit()}
                disabled={!newTitle.trim() || isSubmitting}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-sky-600/30 hover:bg-sky-500 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Adding...' : 'Add card'}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle('');
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        <div ref={listEndRef} />
      </div>

      {/* Column Footer: Inline Add Trigger */}
      {!isAdding && (
        <div className="border-t border-slate-800/60 p-2">
          <button
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition"
          >
            <Plus className="h-4 w-4 text-slate-500" />
            <span>Add a deal</span>
          </button>
        </div>
      )}
    </div>
  );
}
