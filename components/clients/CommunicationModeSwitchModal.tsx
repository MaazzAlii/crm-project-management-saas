'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Mail,
  Phone,
  Radio,
  Lock,
} from 'lucide-react'
import { switchClientToConnectedModeAction } from '@/app/(dashboard)/clients/actions'

interface CommunicationModeSwitchModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  onSuccess?: () => void
}

export function CommunicationModeSwitchModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientEmail,
  clientPhone,
  onSuccess,
}: CommunicationModeSwitchModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const handleConfirmSwitch = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await switchClientToConnectedModeAction(clientId)

      if (res?.error) {
        setError(res.error)
        setIsSubmitting(false)
        return
      }

      setIsSuccess(true)
      setTimeout(() => {
        setIsSubmitting(false)
        onClose()
        if (onSuccess) {
          onSuccess()
        }
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err?.message || 'Failed to switch communication mode.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Communication Hub Upgrade
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Enable Connected Mode for {clientName}
            </h2>
          </div>
        </div>

        {/* Core Explanatory Requirement Warning */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wide">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Permanent Workflow Transition</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
            Enabling Connected Mode will auto-match this client&apos;s email/phone to incoming messages and sync them to the unified inbox. This cannot be undone.
          </p>
        </div>

        {/* Impact Breakdown */}
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
            What happens after switching:
          </span>

          <div className="space-y-2 pt-1 text-slate-400">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>
                Inbound messages from Slack, WhatsApp, Email, Discord, and Upwork are auto-attributed to this client.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span>
                Auto-matching identifier (Email):{' '}
                <span className="font-mono text-slate-200">
                  {clientEmail || 'Not specified (can be added later)'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span>
                Auto-matching identifier (Phone):{' '}
                <span className="font-mono text-slate-200">
                  {clientPhone || 'Not specified (can be added later)'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>
                One-way transition: You cannot switch back to manual mode to ensure existing synced thread logs are never hidden.
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {isSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Connected Mode successfully activated! Updating client...</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmSwitch}
            disabled={isSubmitting || isSuccess}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Activating Connected Mode...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Activated</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>Confirm &amp; Enable Connected Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
