'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PipelineStage, Deal } from '@/lib/types/pipeline';
import { DealCard } from './DealCard';
import {
  Plus,
  X,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Edit2,
  Trash2,
  Minimize2,
  Palette,
  Trophy,
  XCircle,
  GripVertical,
} from 'lucide-react';

export const STAGE_PALETTE = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Sky', hex: '#0ea5e9' },
];

interface ColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  totalValue: number;
  totalDeals: number;
  canManage?: boolean;
  onCardClick?: (deal: Deal) => void;
  onAddCard?: (stageId: string, title: string) => Promise<void>;
  onRenameStage?: (stageId: string, newName: string) => Promise<void>;
  onUpdateStage?: (
    stageId: string,
    input: { name?: string; color?: string; isWon?: boolean; isLost?: boolean }
  ) => Promise<void>;
  onDeleteStageClick?: (stage: PipelineStage) => void;
  existingWonStageName?: string | null;
  existingLostStageName?: string | null;
  isOnlyColumn?: boolean;
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
  canManage = true,
  onCardClick,
  onAddCard,
  onRenameStage,
  onUpdateStage,
  onDeleteStageClick,
  existingWonStageName,
  existingLostStageName,
  isOnlyColumn = false,
}: ColumnProps) {
  // Sortable column hook (for column reordering)
  const {
    attributes: columnAttributes,
    listeners: columnListeners,
    setNodeRef: setSortableNodeRef,
    transform: columnTransform,
    transition: columnTransition,
    isDragging: isColumnDragging,
  } = useSortable({
    id: stage.id,
    data: {
      type: 'Column',
      stage,
    },
    disabled: !canManage,
  });

  // Droppable hook for cards dropped into this column
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: 'Column',
      stage,
    },
  });

  const setCombinedNodeRef = (node: HTMLElement | null) => {
    setSortableNodeRef(node);
    setDroppableNodeRef(node);
  };

  // Card addition state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Stage rename state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(stage.name);
  const [titleError, setTitleError] = useState<string | null>(null);

  // Column menu & palette state
  const [menuOpen, setMenuOpen] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditTitleValue(stage.name);
  }, [stage.name]);

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Click outside to close column menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setShowColorPalette(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleAddSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddCard?.(stage.id, newTitle.trim());
      setNewTitle('');
      setTimeout(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddSubmit();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTitle('');
    }
  };

  const handleStartEditingTitle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canManage) return;
    setEditTitleValue(stage.name);
    setTitleError(null);
    setIsEditingTitle(true);
    setMenuOpen(false);
  };

  const handleSaveTitle = async () => {
    const trimmed = editTitleValue.trim();
    if (!trimmed) {
      setTitleError('Stage name cannot be empty');
      setEditTitleValue(stage.name);
      setIsEditingTitle(false);
      return;
    }
    if (trimmed.length > 50) {
      setTitleError('Maximum 50 characters');
      setEditTitleValue(stage.name);
      setIsEditingTitle(false);
      return;
    }
    if (trimmed === stage.name) {
      setIsEditingTitle(false);
      return;
    }

    try {
      setIsEditingTitle(false);
      if (onRenameStage) {
        await onRenameStage(stage.id, trimmed);
      } else if (onUpdateStage) {
        await onUpdateStage(stage.id, { name: trimmed });
      }
    } catch {
      setEditTitleValue(stage.name);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitleValue(stage.name);
      setIsEditingTitle(false);
      setTitleError(null);
    }
  };

  const handleSelectColor = async (hex: string) => {
    setMenuOpen(false);
    setShowColorPalette(false);
    if (onUpdateStage) {
      await onUpdateStage(stage.id, { color: hex });
    }
  };

  const handleToggleWon = async () => {
    setMenuOpen(false);
    if (stage.is_won) {
      // Remove won
      if (onUpdateStage) await onUpdateStage(stage.id, { isWon: false });
    } else {
      if (
        existingWonStageName &&
        existingWonStageName !== stage.name &&
        !window.confirm(
          `Column "${existingWonStageName}" is currently set as Won. Do you want to set "${stage.name}" as Won instead?`
        )
      ) {
        return;
      }
      if (onUpdateStage) await onUpdateStage(stage.id, { isWon: true, isLost: false });
    }
  };

  const handleToggleLost = async () => {
    setMenuOpen(false);
    if (stage.is_lost) {
      // Remove lost
      if (onUpdateStage) await onUpdateStage(stage.id, { isLost: false });
    } else {
      if (
        existingLostStageName &&
        existingLostStageName !== stage.name &&
        !window.confirm(
          `Column "${existingLostStageName}" is currently set as Lost. Do you want to set "${stage.name}" as Lost instead?`
        )
      ) {
        return;
      }
      if (onUpdateStage) await onUpdateStage(stage.id, { isLost: true, isWon: false });
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
  const isSpecialStage = isWon || isLost;
  const canDelete = canManage && !isOnlyColumn && !isSpecialStage;

  const columnStyle = {
    transform: CSS.Translate.toString(columnTransform),
    transition: columnTransition,
    opacity: isColumnDragging ? 0.35 : 1,
  };

  if (isCollapsed) {
    return (
      <div
        ref={setCombinedNodeRef}
        style={columnStyle}
        onClick={() => setIsCollapsed(false)}
        className="flex h-full w-12 flex-shrink-0 flex-col items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3 py-4 cursor-pointer hover:border-slate-700 hover:bg-slate-900/60 transition select-none"
      >
        <div className="flex flex-col items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: isWon ? '#10b981' : isLost ? '#ef4444' : stage.color || '#6366f1' }}
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
      ref={setCombinedNodeRef}
      style={columnStyle}
      className={`flex h-full w-72 flex-shrink-0 flex-col rounded-2xl border transition-all select-none ${
        isOver
          ? 'border-sky-500/80 bg-slate-900/90 ring-2 ring-sky-500/20'
          : isWon
          ? 'border-t-4 border-t-emerald-500 border-x border-b border-emerald-500/30 bg-slate-950/80 shadow-lg shadow-emerald-950/20'
          : isLost
          ? 'border-t-4 border-t-rose-500 border-x border-b border-rose-500/30 bg-slate-950/80 shadow-lg shadow-rose-950/20'
          : 'border-slate-800/80 bg-slate-950/60'
      }`}
    >
      {/* Column Header */}
      <div
        className={`relative flex items-center justify-between border-b px-3.5 py-3 ${
          isWon
            ? 'border-emerald-500/20 bg-emerald-950/20'
            : isLost
            ? 'border-rose-500/20 bg-rose-950/20'
            : 'border-slate-800/80 bg-slate-900/50'
        } rounded-t-2xl`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
          {/* Header Drag Handle for Column Reordering */}
          {canManage && (
            <div
              {...columnAttributes}
              {...columnListeners}
              className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-300 p-0.5 -ml-1 transition"
              title="Drag header to reorder column"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>
          )}

          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm"
            style={{ backgroundColor: isWon ? '#10b981' : isLost ? '#ef4444' : stage.color || '#6366f1' }}
          />

          {/* Inline Title Editor or Clickable Title */}
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editTitleValue}
              maxLength={50}
              onChange={(e) => setEditTitleValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleTitleKeyDown}
              className="w-full rounded bg-slate-900 px-1.5 py-0.5 text-xs font-bold text-white border border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          ) : (
            <h3
              onClick={handleStartEditingTitle}
              title={canManage ? 'Click to rename' : stage.name}
              className={`truncate text-xs font-bold ${
                isWon ? 'text-emerald-300' : isLost ? 'text-rose-300' : 'text-slate-100'
              } ${canManage ? 'cursor-pointer hover:text-sky-300 transition-colors' : ''}`}
            >
              {stage.name}
            </h3>
          )}

          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold flex-shrink-0 ${
              isWipExceeded
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : isWon
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : isLost
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {totalDeals}
            {stage.wip_limit ? `/${stage.wip_limit}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0" ref={menuRef}>
          <span className="text-[11px] font-bold text-slate-400 font-mono">
            {formattedTotal}
          </span>

          {/* Column Actions Dropdown */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
              setShowColorPalette(false);
            }}
            title="Column actions"
            aria-label={`Column actions for ${stage.name}`}
            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-3 top-10 z-30 w-48 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={handleStartEditingTitle}
                disabled={!canManage}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Rename column</span>
              </button>

              {/* Color Palette Trigger */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPalette(!showColorPalette);
                  }}
                  disabled={!canManage}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5 text-slate-400" />
                    <span>Change color</span>
                  </div>
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: stage.color || '#6366f1' }}
                  />
                </button>

                {showColorPalette && (
                  <div className="my-1.5 grid grid-cols-5 gap-1.5 rounded-lg bg-slate-950 p-2 border border-slate-800">
                    {STAGE_PALETTE.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => handleSelectColor(color.hex)}
                        title={color.name}
                        className="h-5 w-5 rounded-full transition-transform hover:scale-110 flex items-center justify-center border border-white/10"
                        style={{ backgroundColor: color.hex }}
                      >
                        {stage.color === color.hex && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mark as Won / Lost */}
              <button
                onClick={handleToggleWon}
                disabled={!canManage}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                  stage.is_won
                    ? 'text-emerald-300 hover:bg-emerald-500/10'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                <span>{stage.is_won ? 'Remove Won flag' : 'Mark as Won'}</span>
              </button>

              <button
                onClick={handleToggleLost}
                disabled={!canManage}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                  stage.is_lost
                    ? 'text-rose-300 hover:bg-rose-500/10'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>{stage.is_lost ? 'Remove Lost flag' : 'Mark as Lost'}</span>
              </button>

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  setIsCollapsed(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
              >
                <Minimize2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Collapse column</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (canDelete && onDeleteStageClick) {
                    onDeleteStageClick(stage);
                  }
                }}
                disabled={!canDelete}
                title={
                  !canManage
                    ? 'Admins only'
                    : isOnlyColumn
                    ? 'Cannot delete the only column'
                    : isSpecialStage
                    ? 'Cannot delete Won or Lost column'
                    : undefined
                }
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 disabled:opacity-40 transition"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                <span>Delete list</span>
              </button>
            </div>
          )}
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
              stageColor={isWon ? '#10b981' : isLost ? '#ef4444' : stage.color}
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
              onKeyDown={handleCardKeyDown}
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
