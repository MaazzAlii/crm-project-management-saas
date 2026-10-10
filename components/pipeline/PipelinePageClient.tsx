'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Pipeline,
  BoardStageView,
  Deal,
  DealFilters,
  PipelineLabel,
  PipelineStage,
} from '@/lib/types/pipeline';
import { PipelineHeader } from './PipelineHeader';
import { PipelineFilterBar } from './PipelineFilterBar';
import { Board } from './Board';
import { TableView } from './TableView';
import { ForecastView } from './ForecastView';
import { DealDetailModal } from './DealDetailModal';
import { CreateDealModal } from './CreateDealModal';
import { ManagePipelinesModal } from './ManagePipelinesModal';
import { Loader2, Plus, Sparkles, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ToastInfo {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface PipelinePageClientProps {
  initialPipelines: Pipeline[];
  defaultPipelineId: string;
  currentUserId?: string;
  currentUserRole?: string;
}

export function PipelinePageClient({
  initialPipelines,
  defaultPipelineId,
  currentUserId,
  currentUserRole = 'owner',
}: PipelinePageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Admin / owner permissions for managing pipeline columns & settings
  const canManage = ['owner', 'admin', 'org_admin', 'super_admin'].includes(
    currentUserRole?.toLowerCase() || ''
  );

  const [pipelines, setPipelines] = useState<Pipeline[]>(initialPipelines);
  const [activePipelineId, setActivePipelineId] = useState<string>(
    searchParams.get('pipeline') || defaultPipelineId
  );
  const [activeView, setActiveView] = useState<'board' | 'table' | 'forecast'>('board');

  const [boardData, setBoardData] = useState<BoardStageView[]>([]);
  const [labels, setLabels] = useState<PipelineLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Floating Toast Notifications
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Filters & Search
  const [filters, setFilters] = useState<DealFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeDealId, setActiveDealId] = useState<string | null>(searchParams.get('deal') || null);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [showManagePipelines, setShowManagePipelines] = useState(false);

  // Fetch Board Data
  const loadBoardData = useCallback(async () => {
    if (!activePipelineId) return;
    try {
      setLoading(true);
      setErrorBanner(null);

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (filters.ownerId) params.set('ownerId', filters.ownerId);
      if (filters.labelId) params.set('labelId', filters.labelId);
      if (filters.status) params.set('status', filters.status);
      if (filters.minValue !== undefined) params.set('minValue', String(filters.minValue));
      if (filters.maxValue !== undefined) params.set('maxValue', String(filters.maxValue));

      const [boardRes, labelsRes] = await Promise.all([
        fetch(`/api/pipelines/${activePipelineId}/board?${params.toString()}`),
        fetch(`/api/pipelines/${activePipelineId}/labels`),
      ]);

      const boardJson = await boardRes.json();
      const labelsJson = await labelsRes.json();

      if (boardJson.data) {
        setBoardData(boardJson.data);
      } else {
        setErrorBanner(boardJson.error?.message || 'Failed to load pipeline board');
      }

      if (labelsJson.data) {
        setLabels(labelsJson.data);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Network error loading board');
    } finally {
      setLoading(false);
    }
  }, [activePipelineId, filters, searchQuery]);

  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  // Sync active deal modal with URL
  const handleOpenDealModal = (deal: Deal) => {
    setActiveDealId(deal.id);
    const url = new URL(window.location.href);
    url.searchParams.set('deal', deal.id);
    window.history.pushState({}, '', url.toString());
  };

  const handleCloseDealModal = () => {
    setActiveDealId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('deal');
    window.history.pushState({}, '', url.toString());
  };

  // Drag and drop deal move handler with optimistic update and rollback
  const handleMoveDeal = async (
    dealId: string,
    opts: {
      toStageId: string;
      beforeId?: string | null;
      afterId?: string | null;
      expectedVersion?: number;
      lostReason?: string | null;
    }
  ): Promise<boolean> => {
    const previousState = [...boardData];

    // 1. Optimistically calculate new state
    let targetDeal: Deal | null = null;
    for (const stage of boardData) {
      const found = stage.deals.find((d) => d.id === dealId);
      if (found) {
        targetDeal = { ...found, stage_id: opts.toStageId };
        break;
      }
    }

    if (targetDeal) {
      const nextBoard = boardData.map((stageView) => {
        const filtered = stageView.deals.filter((d) => d.id !== dealId);
        if (stageView.stage.id === opts.toStageId) {
          return {
            ...stageView,
            deals: [...filtered, targetDeal!],
            totalDeals: filtered.length + 1,
          };
        }
        return {
          ...stageView,
          deals: filtered,
          totalDeals: filtered.length,
        };
      });
      setBoardData(nextBoard);
    }

    // 2. Perform API request
    try {
      const res = await fetch(`/api/deals/${dealId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      const json = await res.json();

      if (json.data) {
        loadBoardData();
        return true;
      } else {
        setBoardData(previousState);
        showToast(json.error?.message || 'Failed to move deal', 'error');
        return false;
      }
    } catch {
      setBoardData(previousState);
      showToast('Network error while moving deal', 'error');
      return false;
    }
  };

  // Drag and drop stage reorder handler with optimistic update
  const handleReorderStages = async (orderedIds: string[]) => {
    const previousState = [...boardData];

    // Optimistically reorder boardData
    const stageMap = new Map(boardData.map((s) => [s.stage.id, s]));
    const reordered: BoardStageView[] = [];
    for (const id of orderedIds) {
      const found = stageMap.get(id);
      if (found) reordered.push(found);
    }
    setBoardData(reordered);

    try {
      const res = await fetch(`/api/pipelines/${activePipelineId}/stages/order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      const json = await res.json();

      if (json.data) {
        showToast('Column order updated', 'success');
        loadBoardData();
      } else {
        setBoardData(previousState);
        showToast(json.error?.message || 'Failed to reorder columns', 'error');
      }
    } catch {
      setBoardData(previousState);
      showToast('Network error reordering columns', 'error');
    }
  };

  // Update Stage (color, name, won/lost) with optimistic update
  const handleUpdateStage = async (
    stageId: string,
    input: { name?: string; color?: string; isWon?: boolean; isLost?: boolean }
  ) => {
    const previousState = [...boardData];

    // Optimistic update
    setBoardData((prev) =>
      prev.map((sv) => {
        if (sv.stage.id === stageId) {
          return {
            ...sv,
            stage: {
              ...sv.stage,
              ...input,
              name: input.name !== undefined ? input.name : sv.stage.name,
              color: input.color !== undefined ? input.color : sv.stage.color,
              is_won: input.isWon !== undefined ? input.isWon : sv.stage.is_won,
              is_lost: input.isLost !== undefined ? input.isLost : sv.stage.is_lost,
            },
          };
        } else {
          // If another stage was marked won or lost, clear it on other stages
          let newWon = sv.stage.is_won;
          let newLost = sv.stage.is_lost;
          if (input.isWon === true) newWon = false;
          if (input.isLost === true) newLost = false;
          return {
            ...sv,
            stage: {
              ...sv.stage,
              is_won: newWon,
              is_lost: newLost,
            },
          };
        }
      })
    );

    try {
      const res = await fetch(`/api/pipelines/${activePipelineId}/stages/${stageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();

      if (json.data) {
        if (input.name) showToast(`Column renamed to "${input.name}"`, 'success');
        else if (input.color) showToast('Column color updated', 'success');
        else if (input.isWon) showToast('Marked as Won column', 'success');
        else if (input.isLost) showToast('Marked as Lost column', 'success');
        else showToast('Column updated', 'success');
        loadBoardData();
      } else {
        setBoardData(previousState);
        showToast(json.error?.message || 'Failed to update column', 'error');
      }
    } catch {
      setBoardData(previousState);
      showToast('Network error while updating column', 'error');
    }
  };

  // Add Stage with optimistic update
  const handleAddStage = async (name: string) => {
    const tempId = `temp-${Date.now()}`;
    const previousState = [...boardData];

    // Optimistic stage
    const newStage: PipelineStage = {
      id: tempId,
      org_id: '',
      pipeline_id: activePipelineId,
      name,
      color: '#6366f1',
      position: (boardData.length + 1) * 1000.0,
      is_won: false,
      is_lost: false,
      wip_limit: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setBoardData((prev) => [
      ...prev,
      {
        stage: newStage,
        deals: [],
        totalValue: 0,
        totalDeals: 0,
      },
    ]);

    try {
      const res = await fetch(`/api/pipelines/${activePipelineId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();

      if (json.data) {
        showToast(`Column "${name}" added`, 'success');
        loadBoardData();
      } else {
        setBoardData(previousState);
        showToast(json.error?.message || 'Failed to add column', 'error');
      }
    } catch {
      setBoardData(previousState);
      showToast('Network error adding column', 'error');
    }
  };

  // Delete Stage with optimistic update and deal migration
  const handleDeleteStage = async (stageId: string, moveToStageId: string | null) => {
    const previousState = [...boardData];

    // Optimistically remove column and move deals
    const stageViewToDelete = boardData.find((s) => s.stage.id === stageId);
    const dealsToMove = stageViewToDelete?.deals || [];

    setBoardData((prev) =>
      prev
        .filter((s) => s.stage.id !== stageId)
        .map((s) => {
          if (moveToStageId && s.stage.id === moveToStageId) {
            const combinedDeals = [
              ...s.deals,
              ...dealsToMove.map((d) => ({ ...d, stage_id: moveToStageId })),
            ];
            return {
              ...s,
              deals: combinedDeals,
              totalDeals: combinedDeals.length,
              totalValue: combinedDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
            };
          }
          return s;
        })
    );

    try {
      const url = `/api/pipelines/${activePipelineId}/stages/${stageId}${
        moveToStageId ? `?moveTo=${moveToStageId}` : ''
      }`;
      const res = await fetch(url, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.data) {
        showToast('Column deleted successfully', 'success');
        loadBoardData();
      } else {
        setBoardData(previousState);
        showToast(json.error?.message || 'Failed to delete column', 'error');
      }
    } catch {
      setBoardData(previousState);
      showToast('Network error deleting column', 'error');
    }
  };

  // Inline add deal
  const handleAddCardInline = async (stageId: string, title: string) => {
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_id: activePipelineId,
          stage_id: stageId,
          title,
          value: 0,
          probability: 50,
        }),
      });
      const json = await res.json();
      if (json.data) {
        loadBoardData();
      } else {
        showToast(json.error?.message || 'Failed to add card', 'error');
      }
    } catch {
      showToast('Network error adding deal', 'error');
    }
  };

  const handleRefreshPipelines = async () => {
    try {
      const res = await fetch('/api/pipelines');
      const json = await res.json();
      if (json.data) {
        setPipelines(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0] || null;

  // Flatten deals for table view
  const allDeals = boardData.flatMap((s) => s.deals);
  const stages = boardData.map((s) => s.stage);

  // Prompt 03 Requirement 4: The header total uses ONLY open deals (excludes won and lost stages)
  const openStages = boardData.filter((s) => !s.stage.is_won && !s.stage.is_lost);
  const totalDealsCount = openStages.reduce((sum, s) => sum + s.totalDeals, 0);
  const totalPipelineValue = openStages.reduce((sum, s) => sum + s.totalValue, 0);

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 rounded-xl border p-3.5 shadow-2xl text-xs font-semibold animate-in slide-in-from-bottom-2 fade-in duration-200 pointer-events-auto ${
              toast.type === 'error'
                ? 'border-rose-500/40 bg-rose-950/90 text-rose-200 shadow-rose-900/20'
                : toast.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-200 shadow-emerald-900/20'
                : 'border-slate-700 bg-slate-900/90 text-slate-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Top Pipeline Header */}
      <PipelineHeader
        pipelines={pipelines}
        activePipeline={activePipeline}
        activeView={activeView}
        onSelectPipeline={(id) => {
          setActivePipelineId(id);
          const url = new URL(window.location.href);
          url.searchParams.set('pipeline', id);
          window.history.pushState({}, '', url.toString());
        }}
        onSelectView={setActiveView}
        onOpenNewDeal={() => setShowCreateDeal(true)}
        onOpenManagePipelines={() => setShowManagePipelines(true)}
        totalDealsCount={totalDealsCount}
        totalPipelineValue={totalPipelineValue}
      />

      {/* Filter and Search Bar */}
      <PipelineFilterBar
        filters={filters}
        labels={labels}
        currentUserId={currentUserId}
        onFilterChange={setFilters}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      {/* Error banner if any */}
      {errorBanner && (
        <div className="mx-6 mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400 flex items-center justify-between">
          <span>{errorBanner}</span>
          <button
            onClick={loadBoardData}
            className="rounded bg-rose-500 px-2 py-1 text-[11px] font-bold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden relative">
        {loading && boardData.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        ) : boardData.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-4">
              <Layers className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-extrabold text-white">No Sales Pipelines Found</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              Create your organization&apos;s first visual sales pipeline to track leads, stages, and forecast revenue.
            </p>
            <button
              onClick={() => setShowManagePipelines(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition"
            >
              <Plus className="h-4 w-4" /> Create Pipeline
            </button>
          </div>
        ) : activeView === 'board' ? (
          <Board
            boardData={boardData}
            canManage={canManage}
            onMoveDeal={handleMoveDeal}
            onCardClick={handleOpenDealModal}
            onAddCard={handleAddCardInline}
            onAddStage={handleAddStage}
            onRenameStage={(stageId, newName) => handleUpdateStage(stageId, { name: newName })}
            onUpdateStage={handleUpdateStage}
            onDeleteStage={handleDeleteStage}
            onReorderStages={handleReorderStages}
          />
        ) : activeView === 'table' ? (
          <TableView
            deals={allDeals}
            stages={stages}
            pipelineId={activePipelineId}
            onDealClick={handleOpenDealModal}
          />
        ) : (
          <ForecastView pipelineId={activePipelineId} />
        )}
      </div>

      {/* Card Detail Modal */}
      {activeDealId && (
        <DealDetailModal
          dealId={activeDealId}
          pipelineId={activePipelineId}
          stages={stages}
          labels={labels}
          onClose={handleCloseDealModal}
          onDealUpdated={() => loadBoardData()}
          onDealDeleted={() => loadBoardData()}
        />
      )}

      {/* Quick Create Deal Modal */}
      <CreateDealModal
        isOpen={showCreateDeal}
        pipelineId={activePipelineId}
        stages={stages}
        labels={labels}
        onClose={() => setShowCreateDeal(false)}
        onCreated={() => loadBoardData()}
      />

      {/* Manage Pipelines Modal */}
      <ManagePipelinesModal
        isOpen={showManagePipelines}
        pipelines={pipelines}
        activePipelineId={activePipelineId}
        onSelectPipeline={(id) => {
          setActivePipelineId(id);
        }}
        onClose={() => setShowManagePipelines(false)}
        onPipelinesChanged={handleRefreshPipelines}
      />
    </div>
  );
}
