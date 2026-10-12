'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  UserPlus,
  X,
  Mail,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Shield,
  User,
  Eye,
} from 'lucide-react'
import { classifyEmail } from '@/lib/validation/business-email'
import { isValidEmail } from '@/lib/validation/email'

export interface InviteMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  currentUserRole: string
  onSuccess?: (invitation: any, inviteLink?: string) => void
}

interface BillingUsageState {
  planName: string
  planTier: string
  maxMembers: number
  seatsUsed: number
  pendingInvites: number
  maxPendingInvites: number
  seatLimitReached: boolean
  pendingLimitReached: boolean
}

export function InviteMemberDialog({
  isOpen,
  onClose,
  currentUserRole,
  onSuccess,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Billing usage state
  const [usage, setUsage] = useState<BillingUsageState | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(false)

  const isOwner = currentUserRole === 'owner'

  // Fetch billing usage on open
  useEffect(() => {
    if (!isOpen) return

    // Reset form state on dialog open
    setEmail('')
    setRole('member')
    setEmailError(null)
    setServerError(null)
    setSubmitting(false)

    let mounted = true
    setLoadingUsage(true)

    fetch('/api/billing/usage')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return
        if (data.success && data.data) {
          setUsage({
            planName: data.data.planName || 'Free',
            planTier: data.data.planTier || 'free',
            maxMembers: data.data.maxMembers || 3,
            seatsUsed: data.data.seatsUsed ?? data.data.membersUsed ?? 1,
            pendingInvites: data.data.pendingInvites ?? 0,
            maxPendingInvites: data.data.maxPendingInvites ?? 2,
            seatLimitReached: !!data.data.seatLimitReached,
            pendingLimitReached: !!data.data.pendingLimitReached,
          })
        }
      })
      .catch((err) => {
        console.error('Failed to load billing usage:', err)
      })
      .finally(() => {
        if (mounted) setLoadingUsage(false)
      })

    return () => {
      mounted = false
    }
  }, [isOpen])

  if (!isOpen) return null

  // Quota & limit evaluation
  const isSeatLimitReached =
    usage &&
    (usage.seatLimitReached ||
      usage.pendingLimitReached ||
      (usage.maxMembers > 0 && usage.seatsUsed >= usage.maxMembers))

  // Compute seat usage display line
  const seatUsageText = usage
    ? usage.maxMembers >= 9999
      ? `${usage.seatsUsed} of Unlimited seats used`
      : `${usage.seatsUsed} of ${usage.maxMembers} seats used`
    : 'Calculating seats...'

  // Prompt 17 Personal email notice evaluation on paid plans
  const isPaidPlan = usage && usage.planTier !== 'free'
  const emailClassification = email.includes('@') ? classifyEmail(email) : null
  const showPersonalEmailNotice = isPaidPlan && emailClassification?.isPersonal

  // Real-time / on-blur validation
  const validateEmailInput = (value: string): boolean => {
    const clean = value.trim().toLowerCase()
    if (!clean) {
      setEmailError('Email address is required')
      return false
    }
    if (!isValidEmail(clean)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!validateEmailInput(email)) {
      return
    }

    if (isSeatLimitReached) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        const errorMsg =
          data.error?.message || data.message || 'Failed to send invitation. Please try again.'
        setServerError(errorMsg)
        setSubmitting(false)
        return
      }

      // Success: close dialog and notify parent
      onClose()
      if (onSuccess) {
        onSuccess(data.data?.invitation, data.data?.inviteLink)
      }
    } catch (err: any) {
      setServerError(err.message || 'Network error while sending invitation.')
      setSubmitting(false)
    }
  }

  return (
    <div
      data-testid="invite-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-sky-400" />
            Invite Team Member
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Seat Usage Indicator */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Seat Capacity</span>
            <span
              data-testid="seat-usage-line"
              className="font-mono font-bold text-sky-400 flex items-center gap-1.5"
            >
              {loadingUsage ? (
                <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
              ) : null}
              {seatUsageText}
            </span>
          </div>

          {/* Seat Quota Exhausted Warning */}
          {isSeatLimitReached && (
            <div
              data-testid="seat-limit-warning"
              className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300 mt-2"
            >
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">
                  Seat limit reached for {usage?.planName || 'Free'} plan.
                </p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Upgrade your subscription plan to add additional seats and invite more collaborators.
                </p>
                <Link
                  href="/settings/billing"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:underline pt-0.5"
                >
                  View Plans & Upgrade <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Invite Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={email}
              disabled={submitting}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) validateEmailInput(e.target.value)
                if (serverError) setServerError(null)
              }}
              onBlur={(e) => validateEmailInput(e.target.value)}
              placeholder="colleague@company.com"
              className={`w-full rounded-xl border bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono transition ${
                emailError || serverError
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-800 focus:border-sky-500'
              }`}
            />

            {/* Inline Validation Error / Server Message */}
            {(emailError || serverError) && (
              <div
                data-testid="email-error-message"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-400 pt-0.5"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{emailError || serverError}</span>
              </div>
            )}

            {/* Prompt 17: Personal email notice on paid plans */}
            {showPersonalEmailNotice && !emailError && !serverError && (
              <div
                data-testid="personal-email-notice"
                className="flex items-start gap-1.5 text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-1"
              >
                <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Notice: This looks like a personal webmail address. For company workspaces, consider inviting with their corporate email.
                </span>
              </div>
            )}
          </div>

          {/* Role Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Assign Role</span>
              {!isOwner && (
                <span className="text-[10px] text-slate-500 font-normal">
                  (Only owner can invite admins)
                </span>
              )}
            </label>
            <select
              id="role-select"
              name="role"
              value={role}
              disabled={submitting}
              onChange={(e) => setRole(e.target.value as 'admin' | 'member' | 'viewer')}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none cursor-pointer"
            >
              {isOwner && (
                <option value="admin">Admin — Full operational & management access</option>
              )}
              <option value="member">Member — Standard workspace contributor</option>
              <option value="viewer">Viewer — Read-only access to workspace resources</option>
            </select>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !!isSeatLimitReached}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-sky-600/20"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
