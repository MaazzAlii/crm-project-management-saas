'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { BoardStageView, Deal, PipelineStage } from '@/lib/types/pipeline';
import { Column } from './Column';
import { DealCard } from './DealCard';
import { WonLostDialog } from './WonLostDialog';

interface BoardProps {
  boardData: BoardStageView[];
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
  onAddColumn?: () => void;
}

export function Board({
  boardData,
  onMoveDeal,
  onCardClick,
  onAddCard,
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full w-full gap-3 overflow-x-auto p-4 pb-6 scroll-smooth snap-x">
        {boardData.map((stageView) => (
          <Column
            key={stageView.stage.id}
            stage={stageView.stage}
            deals={stageView.deals}
            totalValue={stageView.totalValue}
            totalDeals={stageView.totalDeals}
            onCardClick={onCardClick}
            onAddCard={onAddCard}
          />
        ))}
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
    </DndContext>
  );
}
