'use client'

import { ClientRecord } from '@/components/clients/ClientsList'
import { DealCard } from '@/components/leads/DealCard'
import { PipelineStage } from '@/app/(dashboard)/leads/actions'
import { Plus, DollarSign } from 'lucide-react'

interface ColumnConfig {
  id: PipelineStage
  title: string
  badgeColor: string
  borderColor: string
}

interface KanbanColumnProps {
  column: ColumnConfig
  deals: any[]
  onMoveStage: (clientId: string, newStage: PipelineStage) => void
  onQuickAdd: (stage: PipelineStage) => void
  onOpenScoreModal?: (deal: any) => void
  updatingId: string | null
  aiEnabled?: boolean
}

export function KanbanColumn({
  column,
  deals,
  onMoveStage,
  onQuickAdd,
  onOpenScoreModal,
  updatingId,
  aiEnabled = true,
}: KanbanColumnProps) {
  const totalValue = deals.reduce((sum, d) => sum + (parseFloat(d.deal_value || '0') || 0), 0)

  return (
    <div className={`flex flex-col rounded-2xl border ${column.borderColor} bg-slate-900/40 p-4 min-w-[280px] w-full space-y-4 backdrop-blur-sm`}>
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${column.badgeColor}`} />
          <h3 className="font-bold text-sm text-white tracking-tight">{column.title}</h3>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-extrabold text-slate-300">
            {deals.length}
          </span>
        </div>

        <button
          onClick={() => onQuickAdd(column.id)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          title={`Add deal to ${column.title}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Value Summary Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <span>Total Value</span>
        <span className="font-extrabold text-emerald-400 flex items-center">
          <DollarSign className="h-3 w-3 -mr-0.5" />
          {totalValue > 0 ? totalValue.toLocaleString() : '0'}
        </span>
      </div>

      {/* Cards List Container */}
      <div className="flex-1 space-y-3 min-h-[400px] overflow-y-auto pr-0.5">
        {deals.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-800/80 text-center text-xs text-slate-600">
            No deals in stage
          </div>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              client={deal}
              onMoveStage={onMoveStage}
              onOpenScoreModal={onOpenScoreModal}
              isUpdating={updatingId === deal.id}
              aiEnabled={aiEnabled}
            />
          ))
        )}
      </div>
    </div>
  )
}
