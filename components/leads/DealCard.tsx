'use client'

import Link from 'next/link'
import { ClientRecord } from '@/components/clients/ClientsList'
import { CommunicationModeBadge } from '@/components/clients/CommunicationModeBadge'
import { PipelineStage } from '@/app/(dashboard)/leads/actions'
import {
  Building2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  Zap,
} from 'lucide-react'

interface DealCardProps {
  client: ClientRecord & { deal_value?: number; lost_reason?: string; pipeline_stage?: string }
  onMoveStage: (clientId: string, newStage: PipelineStage) => void
  isUpdating?: boolean
}

const STAGE_ORDER: PipelineStage[] = [
  'new',
  'contacted',
  'qualified',
  'proposal_sent',
  'won',
  'lost',
]

export function DealCard({ client, onMoveStage, isUpdating }: DealCardProps) {
  const currentStage = (client.pipeline_stage || 'new') as PipelineStage
  const currentIdx = STAGE_ORDER.indexOf(currentStage)

  const canMoveLeft = currentIdx > 0
  const canMoveRight = currentIdx < STAGE_ORDER.length - 1

  const prevStage = canMoveLeft ? STAGE_ORDER[currentIdx - 1] : null
  const nextStage = canMoveRight ? STAGE_ORDER[currentIdx + 1] : null

  const dealVal = client.deal_value || 0

  return (
    <div
      className={`group flex flex-col justify-between rounded-xl border bg-slate-900/80 p-4 shadow-md backdrop-blur-sm transition-all hover:border-slate-700 hover:shadow-xl ${
        currentStage === 'won'
          ? 'border-emerald-500/30 bg-emerald-950/10'
          : currentStage === 'lost'
          ? 'border-rose-500/30 bg-rose-950/10'
          : 'border-slate-800'
      } ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="space-y-2.5">
        {/* Header: Name & Link */}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/clients/${client.id}`}
            className="font-bold text-sm text-white hover:text-sky-400 transition flex items-center gap-1.5 leading-tight"
          >
            <span className="line-clamp-1">{client.name}</span>
            <ExternalLink className="h-3 w-3 text-slate-500 shrink-0 opacity-0 group-hover:opacity-100 transition" />
          </Link>
        </div>

        {/* Company */}
        {client.company && (
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Building2 className="h-3 w-3 text-slate-500 shrink-0" />
            <span className="truncate">{client.company}</span>
          </div>
        )}

        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <CommunicationModeBadge mode={client.communication_mode} />
          {client.platform && (
            <span className="inline-flex items-center rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-[10px] font-medium text-slate-300">
              {client.platform}
            </span>
          )}
        </div>

        {/* Deal Value */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
          <span className="text-slate-400">Deal Value:</span>
          <span className="font-extrabold text-emerald-400 flex items-center">
            <DollarSign className="h-3 w-3 -mr-0.5" />
            {dealVal > 0 ? dealVal.toLocaleString() : 'TBD'}
          </span>
        </div>

        {/* Lost Reason if Lost */}
        {currentStage === 'lost' && client.lost_reason && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-[11px] text-rose-300 flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-400" />
            <span className="line-clamp-2">Reason: {client.lost_reason}</span>
          </div>
        )}
      </div>

      {/* Footer Stage Navigation Controls */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60">
        <button
          onClick={() => prevStage && onMoveStage(client.id, prevStage)}
          disabled={!canMoveLeft}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          title={prevStage ? `Move back to ${prevStage.replace('_', ' ')}` : ''}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="capitalize">{prevStage ? prevStage.replace('_', ' ') : ''}</span>
        </button>

        <button
          onClick={() => nextStage && onMoveStage(client.id, nextStage)}
          disabled={!canMoveRight}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          title={nextStage ? `Advance to ${nextStage.replace('_', ' ')}` : ''}
        >
          <span className="capitalize">{nextStage ? nextStage.replace('_', ' ') : ''}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
