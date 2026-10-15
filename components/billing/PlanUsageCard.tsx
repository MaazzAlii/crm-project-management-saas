'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  Users,
  Mail,
  Globe,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

export interface PlanUsageData {
  plan: {
    id: string
    name: string
    price: number | string
    formattedPrice: string
    isFree: boolean
    isPro: boolean
    isEnterprise: boolean
  }
  seats: {
    used: number
    max: number
    remaining: number
    isLimitReached: boolean
  }
  pendingInvitations: {
    used: number
    max: number
    remaining: number
    isLimitReached: boolean
  }
  domain: {
    verified: boolean
    domainName: string | null
    status: string
  }
}

interface PlanUsageCardProps {
  showUpgradePromptOnLimit?: boolean
  className?: string
}

export function PlanUsageCard({
  showUpgradePromptOnLimit = true,
  className = '',
}: PlanUsageCardProps) {
  const [data, setData] = useState<PlanUsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsage() {
      try {
        setLoading(true)
        const res = await fetch('/api/billing/usage', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load plan usage data')
        const resJson = await res.json()
        const raw = resJson.data || resJson
        if (!raw) throw new Error('No data')

        const planTier = raw.planTier || raw.plan?.id || 'free'
        const maxSeats = raw.seats?.max ?? raw.maxMembers ?? 5
        const seatsUsed = raw.seats?.used ?? raw.seatsUsed ?? raw.membersUsed ?? 1
        const maxPending = raw.pendingInvitations?.max ?? raw.maxPendingInvites ?? 2
        const pendingUsed = raw.pendingInvitations?.used ?? raw.pendingInvites ?? 0

        const normalized: PlanUsageData = {
          plan: {
            id: planTier,
            name: raw.plan?.name || raw.planName || 'Free Plan',
            price: raw.plan?.priceMonthlyUsd ?? raw.plan?.price ?? 0,
            formattedPrice:
              raw.plan?.formattedPrice ||
              (raw.plan?.priceMonthlyUsd ? `$${raw.plan.priceMonthlyUsd}/mo` : '$0/mo'),
            isFree: planTier === 'free',
            isPro: planTier === 'pro',
            isEnterprise: planTier === 'enterprise' || planTier === 'lifetime',
          },
          seats: {
            used: seatsUsed,
            max: maxSeats,
            remaining: Math.max(0, maxSeats - seatsUsed),
            isLimitReached: raw.seatLimitReached ?? seatsUsed >= maxSeats,
          },
          pendingInvitations: {
            used: pendingUsed,
            max: maxPending,
            remaining: Math.max(0, maxPending - pendingUsed),
            isLimitReached: raw.pendingLimitReached ?? pendingUsed >= maxPending,
          },
          domain: {
            verified: !!(raw.domainVerified || raw.domain?.verified),
            domainName: raw.verifiedDomain || raw.domain?.domainName || null,
            status: raw.domainVerified || raw.domain?.verified ? 'Verified' : 'Unverified',
          },
        }

        setData(normalized)
      } catch (err: any) {
        setError(err.message || 'Error loading usage')
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [])

  if (loading) {
    return (
      <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex items-center justify-center min-h-[180px] ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
      </div>
    )
  }

  if (error || !data) {
    return null
  }

  const seatPercent = Math.min(
    100,
    Math.round((data.seats.used / Math.max(data.seats.max, 1)) * 100)
  )

  const pendingPercent = Math.min(
    100,
    Math.round((data.pendingInvitations.used / Math.max(data.pendingInvitations.max, 1)) * 100)
  )

  const isLimitReached = data.seats.isLimitReached || data.pendingInvitations.isLimitReached

  return (
    <div
      data-testid="plan-usage-card"
      className={`rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6 ${className}`}
    >
      {/* Header: Plan Name & Price */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-sky-400" />
            <h3 className="text-base font-bold text-white capitalize">
              {data.plan.name} Plan
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                data.plan.isFree
                  ? 'border-slate-700 bg-slate-800 text-slate-300'
                  : 'border-purple-500/30 bg-purple-500/10 text-purple-300'
              }`}
            >
              {data.plan.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Billing & capacity metrics for this workspace
          </p>
        </div>

        <div className="flex items-baseline gap-1 self-start sm:self-auto">
          <span className="text-2xl font-black text-white">{data.plan.formattedPrice}</span>
          <span className="text-xs text-slate-400 font-mono">/month</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Seats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Users className="h-3.5 w-3.5 text-sky-400" />
              Seats
            </span>
            <span className="font-mono text-white font-bold" data-testid="seats-usage-text">
              {data.seats.used} of {data.seats.max}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.seats.isLimitReached ? 'bg-amber-500' : 'bg-sky-500'
              }`}
              style={{ width: `${seatPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {data.seats.remaining > 0
              ? `${data.seats.remaining} seat${data.seats.remaining === 1 ? '' : 's'} available`
              : 'Seat limit reached'}
          </p>
        </div>

        {/* Metric 2: Pending Invitations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Mail className="h-3.5 w-3.5 text-sky-400" />
              Pending Invites
            </span>
            <span className="font-mono text-white font-bold" data-testid="pending-usage-text">
              {data.pendingInvitations.used} of {data.pendingInvitations.max}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.pendingInvitations.isLimitReached ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${pendingPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {data.pendingInvitations.remaining > 0
              ? `${data.pendingInvitations.remaining} slot${data.pendingInvitations.remaining === 1 ? '' : 's'} remaining`
              : 'Max pending invites reached'}
          </p>
        </div>

        {/* Metric 3: Domain Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Globe className="h-3.5 w-3.5 text-sky-400" />
              Domain Status
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                data.domain.verified
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
            >
              {data.domain.verified ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </>
              ) : (
                'Not verified'
              )}
            </span>
          </div>
          <div className="pt-1">
            <p className="text-xs text-slate-300 font-mono truncate">
              {data.domain.domainName || 'No custom domain configured'}
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Prompts (Prompt 41) - Rendered only at limit moments */}
      {showUpgradePromptOnLimit && isLimitReached && data.plan.isFree && (
        <div
          data-testid="upgrade-prompt-limit-reached"
          className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/30 p-4 space-y-2"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            {data.seats.isLimitReached
              ? `Workspace seat limit of ${data.seats.max} reached`
              : `Pending invitation limit of ${data.pendingInvitations.max} reached`}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Upgrade to <strong>Pro ($29/mo)</strong> to unlock up to <strong>15 seats</strong>, 10 pending invitations, business domain verification, and unlimited projects.
          </p>
          <div className="pt-2">
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110 transition shadow-lg shadow-amber-500/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade to Pro
            </Link>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <span className="text-[11px] text-slate-400">
          Need higher limits or dedicated infrastructure?
        </span>

        {data.plan.isFree ? (
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Upgrade to Pro
          </Link>
        ) : data.plan.isPro ? (
          <a
            href="mailto:sales@innoventixhub.tech?subject=Enterprise%20Upgrade%20Inquiry"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            Upgrade to Enterprise
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        ) : (
          <a
            href="mailto:sales@innoventixhub.tech?subject=Enterprise%20Support%20Inquiry"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            Contact sales
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}
