'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { BoardStageView, Deal, PipelineStage } from '@/lib/types/pipeline';
import { Column } from './Column';
import { DealCard } from './DealCard';
import { WonLostDialog } from './WonLostDialog';
import { DeleteStageModal } from './DeleteStageModal';
import { Plus, X, Layers } from 'lucide-react';

interface BoardProps {
  boardData: BoardStageView[];
  canManage?: boolean;
  onMoveDeal: (
    dealId: string,
    opts: {
      toStageId: string;
      beforeId?: string | null;
      afterId?: string | null;
      expectedVersion?: number;
      lostReason?: string | null;
    }
  ) => Promise<boolean>;
  onCardClick?: (deal: Deal) => void;
  onAddCard?: (stageId: string, title: string) => Promise<void>;
  onAddStage?: (name: string) => Promise<void>;
  onRenameStage?: (stageId: string, newName: string) => Promise<void>;
  onDeleteStage?: (stageId: string, moveToStageId: string | null) => Promise<void>;
}

export function Board({
  boardData,
  canManage = true,
  onMoveDeal,
  onCardClick,
  onAddCard,
  onAddStage,
  onRenameStage,
  onDeleteStage,
}: BoardProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [activeStageColor, setActiveStageColor] = useState<string>('#6366f1');

  // Pending lost move state
  const [pendingLostMove, setPendingLostMove] = useState<{
    deal: Deal;
    toStageId: string;
    beforeId?: string | null;
    afterId?: string | null;
  } | null>(null);

  // Add list state
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isSubmittingList, setIsSubmittingList] = useState(false);
  const addListInputRef = useRef<HTMLInputElement>(null);

  // Delete list modal state
  const [stageToDelete, setStageToDelete] = useState<PipelineStage | null>(null);

  useEffect(() => {
    if (isAddingList && addListInputRef.current) {
      addListInputRef.current.focus();
    }
  }, [isAddingList]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px threshold distinguishes clicks from drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = active.data.current?.deal as Deal;
    if (deal) {
      setActiveDeal(deal);
      const stage = boardData.find((s) => s.stage.id === deal.stage_id)?.stage;
      setActiveStageColor(stage?.color || '#6366f1');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const activeDealData = active.data.current?.deal as Deal;
    if (!activeDealData) return;

    // Find destination stage ID
    let destinationStageId: string | null = null;
    if (over.data.current?.type === 'Column') {
      destinationStageId = over.id as string;
    } else if (over.data.current?.type === 'Deal') {
      destinationStageId = over.data.current.stageId as string;
    }

    if (!destinationStageId) return;

    const destStageView = boardData.find((s) => s.stage.id === destinationStageId);
    if (!destStageView) return;

    const destDeals = destStageView.deals.filter((d) => d.id !== activeDealData.id);

    // Calculate beforeId and afterId in destination column
    let beforeId: string | null = null;
    let afterId: string | null = null;

    if (over.data.current?.type === 'Deal') {
      const overDealId = over.id as string;
      const overIndex = destDeals.findIndex((d) => d.id === overDealId);

      if (overIndex !== -1) {
        beforeId = overIndex > 0 ? destDeals[overIndex - 1].id : null;
        afterId = destDeals[overIndex].id;
      }
    } else {
      // Dropped on empty column or column bottom
      if (destDeals.length > 0) {
        beforeId = destDeals[destDeals.length - 1].id;
      }
    }

    // Check if moving to Lost column (requires lost reason)
    if (destStageView.stage.is_lost && activeDealData.stage_id !== destinationStageId) {
      setPendingLostMove({
        deal: activeDealData,
        toStageId: destinationStageId,
        beforeId,
        afterId,
      });
      return;
    }

    // Standard move execution
    await onMoveDeal(activeDealData.id, {
      toStageId: destinationStageId,
      beforeId,
      afterId,
      expectedVersion: activeDealData.version,
    });
  };

  const handleConfirmLost = async (lostReason: string) => {
    if (!pendingLostMove) return;
    const { deal, toStageId, beforeId, afterId } = pendingLostMove;
    setPendingLostMove(null);

    await onMoveDeal(deal.id, {
      toStageId,
      beforeId,
      afterId,
      expectedVersion: deal.version,
      lostReason,
    });
  };

  const handleAddListSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newListTitle.trim();
    if (!trimmed || isSubmittingList) return;

    try {
      setIsSubmittingList(true);
      await onAddStage?.(trimmed);
      setNewListTitle('');
      setIsAddingList(false);
    } finally {
      setIsSubmittingList(false);
    }
  };

  const handleAddListKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddListSubmit();
    } else if (e.key === 'Escape') {
      setIsAddingList(false);
      setNewListTitle('');
    }
  };

  const selectedStageView = stageToDelete
    ? boardData.find((s) => s.stage.id === stageToDelete.id)
    : null;
  const otherStages = stageToDelete
    ? boardData.filter((s) => s.stage.id !== stageToDelete.id).map((s) => s.stage)
    : [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full w-full gap-3 overflow-x-auto p-4 pb-6 scroll-smooth snap-x items-start">
        {boardData.map((stageView) => (
          <Column
            key={stageView.stage.id}
            stage={stageView.stage}
            deals={stageView.deals}
            totalValue={stageView.totalValue}
            totalDeals={stageView.totalDeals}
            canManage={canManage}
            onCardClick={onCardClick}
            onAddCard={onAddCard}
            onRenameStage={onRenameStage}
            onDeleteStageClick={(stage) => setStageToDelete(stage)}
            isOnlyColumn={boardData.length <= 1}
          />
        ))}

        {/* "+ Add another list" column at the end of the board */}
        <div className="flex-shrink-0 w-72">
          {isAddingList ? (
            <div className="rounded-2xl border border-sky-500/50 bg-slate-950/80 p-3 shadow-xl animate-in fade-in duration-150">
              <input
                ref={addListInputRef}
                type="text"
                value={newListTitle}
                maxLength={50}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={handleAddListKeyDown}
                placeholder="Enter list title..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
              <div className="mt-2.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleAddListSubmit()}
                  disabled={!newListTitle.trim() || isSubmittingList}
                  className="rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-sky-600/30 hover:bg-sky-500 disabled:opacity-50 transition"
                >
                  {isSubmittingList ? 'Adding...' : 'Add list'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingList(false);
                    setNewListTitle('');
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                if (canManage) {
                  setIsAddingList(true);
                }
              }}
              disabled={!canManage}
              title={canManage ? 'Add a new column to this pipeline' : 'Admin permission required'}
              className="flex w-full items-center gap-2.5 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-3.5 text-xs font-bold text-slate-400 hover:border-slate-700 hover:bg-slate-900/60 hover:text-slate-200 disabled:opacity-40 transition"
            >
              <Plus className="h-4 w-4 text-slate-500" />
              <span>Add another list</span>
            </button>
          )}
        </div>
      </div>

      {/* Dragging Ghost Overlay */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeDeal ? (
          <div className="rotate-2 scale-105 shadow-2xl opacity-90 cursor-grabbing pointer-events-none">
            <DealCard
              deal={activeDeal}
              stageColor={activeStageColor}
              isDragging={false}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Won/Lost prompt dialog */}
      <WonLostDialog
        isOpen={!!pendingLostMove}
        dealTitle={pendingLostMove?.deal.title}
        onConfirm={handleConfirmLost}
        onCancel={() => setPendingLostMove(null)}
      />

      {/* Delete Stage Modal */}
      {stageToDelete && (
        <DeleteStageModal
          isOpen={!!stageToDelete}
          stage={stageToDelete}
          dealCount={selectedStageView?.totalDeals || 0}
          otherStages={otherStages}
          onConfirm={async (moveToStageId) => {
            if (onDeleteStage) {
              await onDeleteStage(stageToDelete.id, moveToStageId);
            }
          }}
          onClose={() => setStageToDelete(null)}
        />
      )}
    </DndContext>
  );
}
