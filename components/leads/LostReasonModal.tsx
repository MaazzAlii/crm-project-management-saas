'use client'

import { useState } from 'react'
import { X, AlertCircle, Trash2, Send } from 'lucide-react'

interface LostReasonModalProps {
  isOpen: boolean
  clientName: string
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function LostReasonModal({ isOpen, clientName, onClose, onConfirm }: LostReasonModalProps) {
  const [reason, setReason] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(reason.trim() || 'No reason specified')
    setReason('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-base font-bold text-white">Mark Deal as Lost</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Please provide a brief reason for moving <strong className="text-white">{clientName}</strong> to the Lost column (e.g. Price too high, Competitor chosen, Project cancelled).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Loss</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Client budget constraints, deferred timeline..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Confirm Lost</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
