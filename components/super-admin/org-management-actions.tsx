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
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors ${
          isSuspended
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20' // intentional: resume organization action button
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/20' // intentional: suspend organization action button
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`h-5 w-5 ${isSuspended ? 'text-emerald-500' : 'text-rose-500'}`} /> {/* // intentional: modal status icon */}
                <h3 className="text-base font-bold text-card-foreground">
                  {isSuspended ? 'Resume Organization' : 'Suspend Organization'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Target Organization: <strong className="text-card-foreground">{orgName}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                {isSuspended
                  ? 'Resuming access will immediately restore full access for all members of this organization.'
                  : 'Suspending this organization will block all its members from accessing dashboard features until resumed.'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-card-foreground mb-1">
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
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                  rows={3}
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 p-2 text-xs font-medium text-destructive border border-destructive/20">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={isPending}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all ${
                    isSuspended
                      ? 'bg-emerald-600 hover:bg-emerald-500' // intentional: confirm resume action button
                      : 'bg-destructive hover:bg-destructive/90'
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
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'starter' | 'pro' | 'agency' | 'enterprise' | 'lifetime'>(
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
        className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shadow-xs"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Override Plan
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-card-foreground">Manual Plan Override</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Organization: <strong className="text-card-foreground">{orgName}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-card-foreground mb-1.5">
                  Select Target Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['free', 'starter', 'pro', 'agency', 'enterprise', 'lifetime'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedPlan(tier)}
                      className={`rounded-lg border p-2 text-center text-xs font-bold capitalize transition-all ${
                        selectedPlan === tier
                          ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                          : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {tier === 'lifetime' ? '⭐ Lifetime VIP' : tier}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-card-foreground mb-1">
                  Reason for Override (Audit Logged)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Comping internal agency account or granting VIP trial extension."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                  rows={3}
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 p-2 text-xs font-medium text-destructive border border-destructive/20">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
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
