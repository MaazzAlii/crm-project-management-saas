'use client'

import React from 'react'
import {
  CheckCircle2,
  FileCheck,
  AlertCircle,
  X,
  Sparkles,
  Zap,
  Building2,
  DollarSign,
} from 'lucide-react'

interface DeliverProjectConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
  projectTitle: string
  clientName: string
  amount: number
  currency?: string
  paymentSchedule?: string
}

export function DeliverProjectConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  projectTitle,
  clientName,
  amount,
  currency = 'USD',
  paymentSchedule = 'Per Project',
}: DeliverProjectConfirmModalProps) {
  if (!isOpen) return null

  const isPerProject =
    paymentSchedule.toLowerCase().includes('per project') ||
    paymentSchedule.toLowerCase().includes('per_project')

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Deliver Project</h3>
            <p className="text-xs text-muted-foreground">
              Confirm deliverables completion and trigger invoice flow
            </p>
          </div>
        </div>

        {/* Project Details Overview */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Project
              </span>
              <p className="text-sm font-semibold text-foreground">{projectTitle}</p>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Amount
              </span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formattedAmount}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
            <div className="flex items-center gap-1.5 text-foreground">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{clientName}</span>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {paymentSchedule}
            </span>
          </div>
        </div>

        {/* Automation Notice */}
        {isPerProject ? (
          <div className="flex items-start gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-xs text-purple-700 dark:text-purple-200">
            <Zap className="h-4 w-4 shrink-0 text-purple-400 mt-0.5" />
            <div>
              <p className="font-semibold text-purple-900 dark:text-purple-100">Invoice Generation Automated</p>
              <p className="text-purple-700/80 dark:text-purple-300/80 mt-0.5">
                Client billing schedule is <strong>Per Project</strong>. Marking this project as Delivered will immediately emit an outbound webhook to n8n to generate and send an invoice for {formattedAmount}.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 text-xs text-sky-700 dark:text-sky-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
            <div>
              <p className="font-semibold text-sky-900 dark:text-sky-100">Recurring Client Schedule</p>
              <p className="text-sky-700/80 dark:text-sky-300/80 mt-0.5">
                This client operates on a <strong>{paymentSchedule}</strong> retainer. Status will transition to Delivered without generating an ad-hoc project invoice.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20 transition disabled:opacity-50" // intentional: deliver action button requires high-contrast white text on solid purple background
          >
            {isLoading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm & Deliver
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
