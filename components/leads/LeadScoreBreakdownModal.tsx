'use client'

import { useState } from 'react'
import {
  Sparkles,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Clock,
  MessageSquare,
  Briefcase,
  RefreshCw,
  Loader2,
  Lightbulb,
} from 'lucide-react'
import { LeadScoreBreakdown } from '@/lib/ai/features/lead-scoring'
import { scoreLeadAction } from '@/app/(dashboard)/leads/actions'

interface LeadScoreBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  deal: {
    id: string
    name: string
    company?: string | null
    deal_value?: number
    pipeline_stage?: string
    lead_score?: number | null
    lead_score_updated_at?: string | null
    lead_score_breakdown?: LeadScoreBreakdown | null
  }
  onScoreUpdated?: (clientId: string, newScore: number, breakdown: LeadScoreBreakdown) => void
}

export function LeadScoreBreakdownModal({
  isOpen,
  onClose,
  deal,
  onScoreUpdated,
}: LeadScoreBreakdownModalProps) {
  const [isRescoring, setIsRescoring] = useState(false)
  const [breakdown, setBreakdown] = useState<LeadScoreBreakdown | null>(
    deal.lead_score_breakdown || null
  )
  const [currentScore, setCurrentScore] = useState<number | null>(deal.lead_score ?? null)

  if (!isOpen) return null

  const handleRescore = async () => {
    setIsRescoring(true)
    try {
      const res = await scoreLeadAction(deal.id)
      if (res.success && res.score !== undefined && res.breakdown) {
        setCurrentScore(res.score)
        setBreakdown(res.breakdown)
        if (onScoreUpdated) {
          onScoreUpdated(deal.id, res.score, res.breakdown)
        }
      } else if (res.error) {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to re-score deal')
    } finally {
      setIsRescoring(false)
    }
  }

  const score = currentScore ?? 0
  const hasScore = currentScore !== null && currentScore !== undefined

  // User spec color coding:
  // 0-33: Red (Low quality lead)
  // 34-66: Yellow (Medium potential)
  // 67-100: Green (High-quality prospect)
  const getScoreTheme = (s: number) => {
    if (s >= 67) {
      return {
        tier: 'High-Quality Prospect',
        textCol: 'text-emerald-400',
        bgCol: 'bg-emerald-500/10',
        borderCol: 'border-emerald-500/30',
        ringCol: 'text-emerald-500',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        accentBar: 'bg-emerald-500',
      }
    }
    if (s >= 34) {
      return {
        tier: 'Medium Potential',
        textCol: 'text-amber-400',
        bgCol: 'bg-amber-500/10',
        borderCol: 'border-amber-500/30',
        ringCol: 'text-amber-500',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        accentBar: 'bg-amber-500',
      }
    }
    return {
      tier: 'Low Quality Lead',
      textCol: 'text-rose-400',
      bgCol: 'bg-rose-500/10',
      borderCol: 'border-rose-500/30',
      ringCol: 'text-rose-500',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      accentBar: 'bg-rose-500',
    }
  }

  const theme = getScoreTheme(score)

  const getFactorIcon = (factorName: string) => {
    const f = factorName.toLowerCase()
    if (f.includes('deal') || f.includes('value') || f.includes('budget')) {
      return <DollarSign className="w-4 h-4 text-emerald-400" />
    }
    if (f.includes('stage') || f.includes('speed') || f.includes('velocity')) {
      return <Clock className="w-4 h-4 text-sky-400" />
    }
    if (f.includes('engage') || f.includes('message') || f.includes('communicat')) {
      return <MessageSquare className="w-4 h-4 text-indigo-400" />
    }
    return <Briefcase className="w-4 h-4 text-purple-400" />
  }

  const factors = breakdown?.factors || [
    { factor: 'Deal Value', impact: 'neutral' as const, description: deal.deal_value ? `Contract value of $${deal.deal_value.toLocaleString()}` : 'Deal value unconfirmed' },
    { factor: 'Stage Progression Speed', impact: 'neutral' as const, description: `Active in ${deal.pipeline_stage || 'new'} stage` },
    { factor: 'Client Engagement', impact: 'neutral' as const, description: 'Evaluation pending message activity' },
    { factor: 'Project History', impact: 'neutral' as const, description: 'Account delivery history assessment' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Ribbon */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-white text-base leading-tight">
                  {deal.name}
                </h3>
                {deal.company && (
                  <span className="text-xs text-slate-400 font-medium">
                    ({deal.company})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI Lead Qualification & Pipeline Health Analysis
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Score Hero Card */}
          <div className={`rounded-2xl p-5 border ${theme.borderCol} ${theme.bgCol} flex flex-col md:flex-row items-center justify-between gap-5`}>
            <div className="flex items-center gap-4">
              {/* Score Circular Gauge */}
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-slate-800 bg-slate-950 shadow-inner shrink-0">
                <div className={`text-2xl font-black ${theme.textCol}`}>
                  {hasScore ? `${score}%` : 'N/A'}
                </div>
              </div>

              <div>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                  <Sparkles className="w-3 h-3" />
                  {theme.tier}
                </span>
                <div className="text-xs text-slate-300 mt-1 font-medium">
                  {score >= 67 && 'High probability of win conversion'}
                  {score >= 34 && score < 67 && 'Moderate qualification momentum'}
                  {score < 34 && 'Requires discovery & budget confirmation'}
                </div>
                {deal.deal_value ? (
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Estimated Deal Value: <span className="font-extrabold text-white">${deal.deal_value.toLocaleString()}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Re-Score Button */}
            <button
              type="button"
              onClick={handleRescore}
              disabled={isRescoring}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 self-stretch md:self-auto justify-center"
            >
              {isRescoring ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{hasScore ? 'Re-calculate' : 'Calculate Score'}</span>
                </>
              )}
            </button>
          </div>

          {/* AI Executive Summary */}
          {breakdown?.summary && (
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Executive Assessment
              </span>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                {breakdown.summary}
              </div>
            </div>
          )}

          {/* AI Recommended Action */}
          {breakdown?.recommendedAction && (
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Recommended Next Step
              </span>
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed font-medium">
                {breakdown.recommendedAction}
              </div>
            </div>
          )}

          {/* Contributing Factors Breakdown (The 4 core dimensions) */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Scoring Factor Breakdown
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {factors.map((factor, idx) => {
                const isPositive = factor.impact === 'positive'
                const isNegative = factor.impact === 'negative'

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        {getFactorIcon(factor.factor)}
                        <span>{factor.factor}</span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isNegative
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isPositive ? '+ Positive' : isNegative ? '- Needs Attention' : 'Neutral'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {factor.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer Timestamp & Disclaimer */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {breakdown?.calculatedAt
                ? `Scored on ${new Date(breakdown.calculatedAt).toLocaleString()}`
                : 'Score pending initial calculation'}
            </span>
            <span>Assistive signal only • Never auto-moves stages</span>
          </div>
        </div>
      </div>
    </div>
  )
}
