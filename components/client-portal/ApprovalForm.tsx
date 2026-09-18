'use client'

import { useState, useTransition } from 'react'
import { approveDeliverable, requestRevision } from '@/app/(client-portal)/client/projects/[id]/actions'
import { CheckCircle, RotateCcw, Loader2, AlertCircle, CheckSquare, MessageSquare } from 'lucide-react'

interface ApprovalFormProps {
  deliverableId: string
  projectId: string
  deliverableTitle: string
  currentStatus: 'pending' | 'approved' | 'revision_required'
}

export function ApprovalForm({ deliverableId, projectId, deliverableTitle, currentStatus }: ApprovalFormProps) {
  const [mode, setMode] = useState<'idle' | 'approve' | 'revision'>('idle')
  const [feedback, setFeedback] = useState('')
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleApprove = () => {
    setResult(null)
    startTransition(async () => {
      const res = await approveDeliverable(deliverableId, projectId)
      if (res.success) {
        setResult({ type: 'success', message: 'Deliverable approved! The team has been notified.' })
        setMode('idle')
      } else {
        setResult({ type: 'error', message: res.error ?? 'Something went wrong.' })
      }
    })
  }

  const handleRevision = () => {
    setResult(null)
    startTransition(async () => {
      const res = await requestRevision(deliverableId, projectId, feedback)
      if (res.success) {
        setResult({ type: 'success', message: 'Revision request sent! The team will be in touch.' })
        setMode('idle')
        setFeedback('')
      } else {
        setResult({ type: 'error', message: res.error ?? 'Something went wrong.' })
      }
    })
  }

  if (currentStatus === 'approved') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
        <CheckCircle className="h-4 w-4 shrink-0" />
        <span>This deliverable has been approved.</span>
      </div>
    )
  }

  if (currentStatus === 'revision_required') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        <RotateCcw className="h-4 w-4 shrink-0" />
        <span>Revision requested — the team is working on it.</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Result feedback */}
      {result && (
        <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
          result.type === 'success'
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            : 'border-red-500/20 bg-red-500/10 text-red-400'
        }`}>
          {result.type === 'success' ? (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{result.message}</span>
        </div>
      )}

      {/* Action buttons */}
      {mode === 'idle' && !result && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setMode('approve')}
            className="flex items-center gap-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-4 py-2.5 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-600/30 hover:border-emerald-500/50"
          >
            <CheckSquare className="h-4 w-4" />
            Approve Deliverable
          </button>
          <button
            onClick={() => setMode('revision')}
            className="flex items-center gap-2 rounded-xl bg-orange-500/15 border border-orange-500/25 px-4 py-2.5 text-sm font-medium text-orange-400 transition-all hover:bg-orange-500/25 hover:border-orange-500/40"
          >
            <MessageSquare className="h-4 w-4" />
            Request Revision
          </button>
        </div>
      )}

      {/* Approve confirmation */}
      {mode === 'approve' && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
          <p className="text-sm text-slate-300">
            Confirm approval of <span className="font-semibold text-white">&ldquo;{deliverableTitle}&rdquo;</span>?
            The team will be notified.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="portal-btn-primary py-2 px-5 text-sm bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4" /> Confirm Approval</>}
            </button>
            <button
              onClick={() => setMode('idle')}
              disabled={isPending}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Revision form */}
      {mode === 'revision' && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-3">
          <label className="block text-sm font-medium text-slate-300">
            Describe what changes are needed:
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Please adjust the color palette to match our brand guidelines and re-export at 4K resolution..."
            rows={4}
            className="portal-input resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleRevision}
              disabled={isPending || !feedback.trim()}
              className="portal-btn-primary py-2 px-5 text-sm"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RotateCcw className="h-4 w-4" /> Send Revision Request</>}
            </button>
            <button
              onClick={() => { setMode('idle'); setFeedback('') }}
              disabled={isPending}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
