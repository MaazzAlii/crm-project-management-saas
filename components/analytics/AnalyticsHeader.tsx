'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BarChart3,
  Calendar,
  Sparkles,
  Loader2,
  X,
  Copy,
  Check,
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { AnalyticsDateRange } from '@/lib/analytics/data'
import { generateAnalyticsNarrativeAction } from '@/app/actions/analytics'

interface AnalyticsHeaderProps {
  currentRange: AnalyticsDateRange
  aiEnabled: boolean
  organizationName?: string
}

export function AnalyticsHeader({
  currentRange,
  aiEnabled,
  organizationName = 'Innoventix Hub',
}: AnalyticsHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoadingNarrative, setIsLoadingNarrative] = useState(false)
  const [narrativeText, setNarrativeText] = useState<string | null>(null)
  const [narrativeError, setNarrativeError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const ranges: Array<{ id: AnalyticsDateRange; label: string }> = [
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: 'ytd', label: 'Year to Date' },
    { id: 'all', label: 'All Time' },
  ]

  const handleRangeChange = (newRange: AnalyticsDateRange) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('range', newRange)
    router.push(`/analytics?${params.toString()}`)
  }

  const handleGenerateNarrative = async () => {
    setIsLoadingNarrative(true)
    setNarrativeError(null)

    try {
      const res = await generateAnalyticsNarrativeAction(currentRange)
      if (res.success && res.narrative) {
        setNarrativeText(res.narrative)
        setIsExpanded(true)
      } else {
        setNarrativeError(res.error || 'Failed to generate narrative summary.')
      }
    } catch (err: any) {
      setNarrativeError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsLoadingNarrative(false)
    }
  }

  const handleCopy = () => {
    if (!narrativeText) return
    navigator.clipboard.writeText(narrativeText)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Agency Analytics & Intelligence
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Live Overview
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Performance metrics, revenue pipeline, team capacity, and project delivery velocity for{' '}
              <span className="text-slate-200 font-semibold">{organizationName}</span>.
            </p>
          </div>
        </div>

        {/* Right Controls: Date Range & AI Action */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector Pills */}
          <div className="flex items-center rounded-2xl bg-slate-950 p-1 border border-slate-800">
            {ranges.map((r) => {
              const isActive = currentRange === r.id
              return (
                <button
                  key={r.id}
                  onClick={() => handleRangeChange(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              )
            })}
          </div>

          {/* AI Executive Narrative Trigger — strictly omitted if AI is disabled (zero-button rule) */}
          {aiEnabled && (
            <button
              onClick={handleGenerateNarrative}
              disabled={isLoadingNarrative}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition shrink-0"
              title="Generate AI-powered executive report narrative based on current analytics data"
            >
              {isLoadingNarrative ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>AI Executive Brief</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* AI Narrative Collapsible Card */}
      {narrativeText && (
        <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 to-slate-900/90 p-5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Executive Narrative Summary</h3>
                <p className="text-[11px] text-indigo-300/80">
                  Synthesized executive overview for {organizationName} ({currentRange.toUpperCase()})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition"
              >
                {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition"
              >
                <Printer className="h-3 w-3" />
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              <button
                onClick={() => setNarrativeText(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 text-xs leading-relaxed whitespace-pre-line">
              {narrativeText}
            </div>
          )}
        </div>
      )}

      {/* AI Error Notification */}
      {narrativeError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-center justify-between">
          <span>{narrativeError}</span>
          <button
            onClick={() => setNarrativeError(null)}
            className="text-red-400 hover:text-red-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
