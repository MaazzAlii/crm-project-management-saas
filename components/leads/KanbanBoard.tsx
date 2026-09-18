'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClientRecord } from '@/components/clients/ClientsList'
import { KanbanColumn } from '@/components/leads/KanbanColumn'
import { LostReasonModal } from '@/components/leads/LostReasonModal'
import { QuickLeadModal } from '@/components/leads/QuickLeadModal'
import { LeadScoreBreakdownModal } from '@/components/leads/LeadScoreBreakdownModal'
import { updateLeadStageAction, batchScoreLeadsAction, PipelineStage } from '@/app/(dashboard)/leads/actions'
import { Kanban, Plus, DollarSign, Trophy, Sparkles, Filter, Loader2 } from 'lucide-react'

interface KanbanBoardProps {
  initialDeals: any[]
  aiEnabled?: boolean
}

const COLUMNS: Array<{
  id: PipelineStage
  title: string
  badgeColor: string
  borderColor: string
}> = [
  { id: 'new', title: 'Lead (New)', badgeColor: 'bg-sky-400', borderColor: 'border-slate-800' },
  { id: 'contacted', title: 'Contacted', badgeColor: 'bg-indigo-400', borderColor: 'border-slate-800' },
  { id: 'qualified', title: 'Qualified', badgeColor: 'bg-purple-400', borderColor: 'border-slate-800' },
  { id: 'proposal_sent', title: 'Proposal Sent', badgeColor: 'bg-amber-400', borderColor: 'border-slate-800' },
  { id: 'won', title: 'Won (Active)', badgeColor: 'bg-emerald-400', borderColor: 'border-emerald-500/30' },
  { id: 'lost', title: 'Lost', badgeColor: 'bg-rose-400', borderColor: 'border-rose-500/30' },
]

export function KanbanBoard({ initialDeals, aiEnabled = true }: KanbanBoardProps) {
  const router = useRouter()
  const [deals, setDeals] = useState<any[]>(initialDeals)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [pendingLostClientId, setPendingLostClientId] = useState<string | null>(null)
  const [pendingLostClientName, setPendingLostClientName] = useState('')
  const [quickAddStage, setQuickAddStage] = useState<PipelineStage | null>(null)
  const [selectedScoreDeal, setSelectedScoreDeal] = useState<any | null>(null)
  const [isBatchScoring, setIsBatchScoring] = useState(false)

  useEffect(() => {
    setDeals(initialDeals)
  }, [initialDeals])

  // Calculate high-level pipeline stats
  const totalPipelineValue = initialDeals.reduce(
    (acc, d) => acc + (parseFloat(d.deal_value || '0') || 0),
    0
  )
  const wonDealsValue = initialDeals
    .filter((d) => d.pipeline_stage === 'won')
    .reduce((acc, d) => acc + (parseFloat(d.deal_value || '0') || 0), 0)

  async function handleMoveStage(clientId: string, newStage: PipelineStage) {
    if (newStage === 'lost') {
      const client = initialDeals.find((d) => d.id === clientId)
      setPendingLostClientId(clientId)
      setPendingLostClientName(client?.name || 'Client')
      return
    }

    setUpdatingId(clientId)
    const res = await updateLeadStageAction(clientId, newStage)
    setUpdatingId(null)

    if (res.error) {
      alert(res.error)
      return
    }

    router.refresh()
  }

  async function handleConfirmLost(reason: string) {
    if (!pendingLostClientId) return

    const clientId = pendingLostClientId
    setPendingLostClientId(null)
    setUpdatingId(clientId)

    const res = await updateLeadStageAction(clientId, 'lost', reason)
    setUpdatingId(null)

    if (res.error) {
      alert(res.error)
      return
    }

    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Header & Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Sales Pipeline</h1>
            <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-xs font-bold text-sky-400">
              Kanban
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Track lead prospects, stage transitions, deal values, and win conversions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Total Value Metric */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Pipeline Total</div>
              <div className="font-black text-white text-sm flex items-center text-emerald-400">
                <DollarSign className="h-3.5 w-3.5 -mr-0.5" />
                {totalPipelineValue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Won Value Metric */}
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                <span>Won Revenue</span>
              </div>
              <div className="font-black text-emerald-300 text-sm flex items-center">
                <DollarSign className="h-3.5 w-3.5 -mr-0.5" />
                {wonDealsValue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* AI Batch Re-Score Button - only visible if AI is enabled */}
          {aiEnabled && (
            <button
              onClick={handleBatchScore}
              disabled={isBatchScoring}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/40 px-3.5 py-2.5 text-xs font-bold text-indigo-300 transition-all shadow-xs disabled:opacity-50"
              title="Run multi-factor AI lead scoring across active pipeline deals"
            >
              <Sparkles className={`h-3.5 w-3.5 text-indigo-400 ${isBatchScoring ? 'animate-spin' : ''}`} />
              <span>{isBatchScoring ? 'Scoring...' : 'AI Re-Score'}</span>
            </button>
          )}

          {/* Quick Create Deal Button */}
          <button
            onClick={() => setQuickAddStage('new')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/25 hover:from-sky-400 hover:to-blue-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Deal</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {COLUMNS.map((col) => {
          const dealsInCol = deals.filter(
            (d) => (d.pipeline_stage || 'new') === col.id
          )
          return (
            <KanbanColumn
              key={col.id}
              column={col}
              deals={dealsInCol}
              onMoveStage={handleMoveStage}
              onQuickAdd={(stage) => setQuickAddStage(stage)}
              onOpenScoreModal={(deal) => setSelectedScoreDeal(deal)}
              updatingId={updatingId}
              aiEnabled={aiEnabled}
            />
          )
        })}
      </div>

      {/* Lost Reason Modal */}
      <LostReasonModal
        isOpen={!!pendingLostClientId}
        clientName={pendingLostClientName}
        onClose={() => setPendingLostClientId(null)}
        onConfirm={handleConfirmLost}
      />

      {/* Quick Add Lead Modal */}
      <QuickLeadModal
        isOpen={!!quickAddStage}
        defaultStage={quickAddStage || 'new'}
        onClose={() => setQuickAddStage(null)}
      />

      {/* AI Lead Score Breakdown Modal */}
      {selectedScoreDeal && (
        <LeadScoreBreakdownModal
          isOpen={!!selectedScoreDeal}
          deal={selectedScoreDeal}
          onClose={() => setSelectedScoreDeal(null)}
          onScoreUpdated={handleScoreUpdated}
        />
      )}
    </div>
  )

  async function handleBatchScore() {
    setIsBatchScoring(true)
    try {
      const res = await batchScoreLeadsAction()
      if (res.success) {
        router.refresh()
      } else if (res.error) {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to score pipeline deals')
    } finally {
      setIsBatchScoring(false)
    }
  }

  function handleScoreUpdated(clientId: string, newScore: number, breakdown: any) {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === clientId
          ? {
              ...d,
              lead_score: newScore,
              lead_score_breakdown: breakdown,
              lead_score_updated_at: breakdown.calculatedAt,
            }
          : d
      )
    )
    if (selectedScoreDeal && selectedScoreDeal.id === clientId) {
      setSelectedScoreDeal((prev: any) => ({
        ...prev,
        lead_score: newScore,
        lead_score_breakdown: breakdown,
        lead_score_updated_at: breakdown.calculatedAt,
      }))
    }
  }
}
