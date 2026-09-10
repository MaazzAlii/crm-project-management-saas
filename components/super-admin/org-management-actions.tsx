'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Loader2, X } from 'lucide-react'
import { toggleSuspendOrganization, overrideOrganizationPlan } from '@/app/super-admin/actions'

interface SuspendOrgModalProps {
  orgId: string
  orgName: string
  isSuspended: boolean
}

export function SuspendOrgModal({ orgId, orgName, isSuspended }: SuspendOrgModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAction = () => {
    setError(null)
    startTransition(async () => {
      const res = await toggleSuspendOrganization(orgId, !isSuspended, reason)
      if (res.error) {
        setError(res.error)
      } else {
        setIsOpen(false)
        setReason('')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
          isSuspended
            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
            : 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30'
        }`}
      >
        {isSuspended ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resume Access
          </>
        ) : (
          <>
            <AlertTriangle className="h-3.5 w-3.5" />
            Suspend Organization
          </>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`h-5 w-5 ${isSuspended ? 'text-emerald-400' : 'text-rose-400'}`} />
                <h3 className="text-base font-bold text-white">
                  {isSuspended ? 'Resume Organization' : 'Suspend Organization'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-300">
                Target Organization: <strong className="text-white">{orgName}</strong>
              </p>
              <p className="text-xs text-slate-400">
                {isSuspended
                  ? 'Resuming access will immediately restore full access for all members of this organization.'
                  : 'Suspending this organization will block all its members from accessing dashboard features until resumed.'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Audit Trail
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    isSuspended
                      ? 'e.g. Payment resolved or support review completed.'
                      : 'e.g. Terms of service review or non-payment.'
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  rows={3}
                />
              </div>

              {error && (
                <p className="rounded-md bg-rose-500/10 p-2 text-xs font-medium text-rose-400 border border-rose-500/20">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={isPending}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-md transition-all ${
                    isSuspended
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm {isSuspended ? 'Resume' : 'Suspend'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface OverridePlanModalProps {
  orgId: string
  orgName: string
  currentPlanTier: string
}

export function OverridePlanModal({ orgId, orgName, currentPlanTier }: OverridePlanModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'starter' | 'pro' | 'enterprise'>(
    (currentPlanTier.toLowerCase() as any) || 'free'
  )
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAction = () => {
    setError(null)
    startTransition(async () => {
      const res = await overrideOrganizationPlan(orgId, selectedPlan, reason)
      if (res.error) {
        setError(res.error)
      } else {
        setIsOpen(false)
        setReason('')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-600/20 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-600/30 transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
        Override Plan
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Manual Plan Override</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-300">
                Organization: <strong className="text-white">{orgName}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Target Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['free', 'starter', 'pro', 'enterprise'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedPlan(tier)}
                      className={`rounded-lg border p-2 text-center text-xs font-bold capitalize transition-all ${
                        selectedPlan === tier
                          ? 'border-purple-500 bg-purple-600/30 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Override (Audit Logged)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Comping internal agency account or granting VIP trial extension."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  rows={3}
                />
              </div>

              {error && (
                <p className="rounded-md bg-rose-500/10 p-2 text-xs font-medium text-rose-400 border border-rose-500/20">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 shadow-md transition-all"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Apply Plan Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
