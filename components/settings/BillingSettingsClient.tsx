'use client'

import { useState } from 'react'
import {
  CreditCard,
  Zap,
  Check,
  ArrowUpRight,
  ShieldCheck,
  Users,
  Briefcase,
  FolderKanban,
  HardDrive,
  Radio,
  Sparkles,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { createCheckoutSession, createCustomerPortalSession } from '@/app/actions/stripe'
import type { OrganizationPlanUsage } from '@/lib/billing/plan-limits'

interface BillingSettingsClientProps {
  usage: OrganizationPlanUsage
}

export function BillingSettingsClient({ usage }: BillingSettingsClientProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    planName,
    planSlug,
    status,
    renewsAt,
    priceMonthly,
    metrics,
    hasWarnings,
    highestProximityPercent,
  } = usage

  const handlePortal = async () => {
    setLoading('portal')
    setError(null)
    const res = await createCustomerPortalSession()
    if (res.url) {
      window.location.href = res.url
    } else {
      setError(res.error || 'Failed to open customer portal')
      setLoading(null)
    }
  }

  const handleUpgrade = async (priceId: string, planTargetSlug: string) => {
    setLoading(planTargetSlug)
    setError(null)
    const res = await createCheckoutSession(priceId)
    if (res.url) {
      window.location.href = res.url
    } else {
      setError(res.error || 'Failed to initialize checkout')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Billing & Subscription</h1>
            <p className="text-sm text-slate-400">
              Manage your organization plan, resource usage, and invoice history.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Current Plan Overview Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Subscription</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{status}</span>
            </span>
          </div>
          <h2 className="text-3xl font-black text-white">{planName}</h2>
          <p className="text-sm text-slate-400">
            ${priceMonthly}.00 / mo {renewsAt && `• Renews automatically on ${renewsAt}`}
          </p>
        </div>

        <button
          onClick={handlePortal}
          disabled={loading === 'portal'}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {loading === 'portal' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Manage Payment Method</span>
              <ArrowUpRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Proximity Warning Banner */}
      {hasWarnings && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            highestProximityPercent >= 95
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              highestProximityPercent >= 95 ? 'text-rose-400' : 'text-amber-400'
            }`}
          />
          <div className="text-xs space-y-1 flex-1">
            <p className="font-bold text-sm text-white">
              {highestProximityPercent >= 95
                ? 'Critical Plan Capacity Warning (≥95%)'
                : 'Plan Capacity Notice (≥80%)'}
            </p>
            <p className="opacity-90">
              One or more of your organization resources has reached {highestProximityPercent}% of your tier allowance. Upgrade your tier to avoid operational blocks.
            </p>
          </div>
        </div>
      )}

      {/* Usage vs Plan Limits Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Resource Usage vs Plan Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Team Members */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <Users className="w-4 h-4 text-blue-400" />
                Team Members
              </span>
              <span className="text-slate-400 font-bold font-mono">
                {metrics.teamMembers.current} / {metrics.teamMembers.max}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  metrics.teamMembers.status === 'critical' || metrics.teamMembers.status === 'exceeded'
                    ? 'bg-rose-500'
                    : metrics.teamMembers.status === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${metrics.teamMembers.percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">{metrics.teamMembers.percentage}% capacity utilized</p>
          </div>

          {/* Active Clients */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Active Clients
              </span>
              <span className="text-slate-400 font-bold font-mono">
                {metrics.clients.current} / {metrics.clients.max}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  metrics.clients.status === 'critical' || metrics.clients.status === 'exceeded'
                    ? 'bg-rose-500'
                    : metrics.clients.status === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${metrics.clients.percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">{metrics.clients.percentage}% capacity utilized</p>
          </div>

          {/* Active Projects */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <FolderKanban className="w-4 h-4 text-emerald-400" />
                Active Projects
              </span>
              <span className="text-slate-400 font-bold font-mono">
                {metrics.projects.current} / {metrics.projects.max}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  metrics.projects.status === 'critical' || metrics.projects.status === 'exceeded'
                    ? 'bg-rose-500'
                    : metrics.projects.status === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${metrics.projects.percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">{metrics.projects.percentage}% capacity utilized</p>
          </div>

          {/* Storage */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                Storage Space
              </span>
              <span className="text-slate-400 font-bold font-mono">
                {metrics.storage.current} GB / {metrics.storage.max} GB
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all"
                style={{ width: `${metrics.storage.percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">{metrics.storage.percentage}% storage used</p>
          </div>

          {/* Connected Channels */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <Radio className="w-4 h-4 text-purple-400" />
                Connected Channels
              </span>
              <span className="text-slate-400 font-bold font-mono">
                {metrics.channels.current} / {metrics.channels.max}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-purple-500 h-full rounded-full transition-all"
                style={{ width: `${metrics.channels.percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">{metrics.channels.percentage}% channels used</p>
          </div>

          {/* AI Usage */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Monthly AI Invocations
              </span>
              <span className="text-slate-400 font-bold font-mono">
                {metrics.aiUsage.current} requests
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${metrics.aiUsage.percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">Tracked across lead scoring & narratives</p>
          </div>
        </div>
      </div>

      {/* Available Tier Upgrade Cards */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-white">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter */}
          <div
            className={`bg-slate-900/60 border rounded-2xl p-6 space-y-4 flex flex-col justify-between ${
              planSlug === 'starter' ? 'border-blue-500/80' : 'border-slate-800'
            }`}
          >
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Starter</h4>
              <p className="text-2xl font-black text-white">
                $29 <span className="text-xs text-slate-400 font-normal">/ mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> Up to 5 team members
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> 25 active clients
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> 50 projects
                </li>
              </ul>
            </div>
            {planSlug === 'starter' ? (
              <button
                disabled
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-blue-400 bg-blue-900/40 border border-blue-800/80 cursor-default"
              >
                Current Active Plan
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade('price_starter_monthly', 'starter')}
                disabled={loading === 'starter'}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Switch to Starter
              </button>
            )}
          </div>

          {/* Pro */}
          <div
            className={`bg-slate-900/60 border rounded-2xl p-6 space-y-4 flex flex-col justify-between relative ${
              planSlug === 'pro'
                ? 'bg-blue-950/30 border-2 border-blue-500/80 shadow-xl shadow-blue-500/10'
                : 'border-slate-800'
            }`}
          >
            {planSlug === 'pro' && (
              <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                Current Plan
              </span>
            )}
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Pro</h4>
              <p className="text-2xl font-black text-white">
                $79 <span className="text-xs text-slate-400 font-normal">/ mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> Up to 15 team members
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> 100 active clients
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> AI Reply & Lead Scoring
                </li>
              </ul>
            </div>
            {planSlug === 'pro' ? (
              <button
                disabled
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-blue-400 bg-blue-900/40 border border-blue-800/80 cursor-default"
              >
                Current Active Plan
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade('price_pro_monthly', 'pro')}
                disabled={loading === 'pro'}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                Upgrade to Pro
              </button>
            )}
          </div>

          {/* Enterprise */}
          <div
            className={`bg-slate-900/60 border rounded-2xl p-6 space-y-4 flex flex-col justify-between ${
              planSlug === 'enterprise' ? 'border-emerald-500/80' : 'border-slate-800'
            }`}
          >
            {planSlug === 'enterprise' && (
              <span className="absolute -top-3 right-6 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                Current Plan
              </span>
            )}
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Enterprise</h4>
              <p className="text-2xl font-black text-white">
                $199 <span className="text-xs text-slate-400 font-normal">/ mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> Unlimited team & clients
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> AI Task Extraction & Narratives
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> Dedicated VPS Storage
                </li>
              </ul>
            </div>
            {planSlug === 'enterprise' ? (
              <button
                disabled
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-emerald-400 bg-emerald-900/40 border border-emerald-800/80 cursor-default"
              >
                Current Active Plan
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade('price_enterprise_monthly', 'enterprise')}
                disabled={loading === 'enterprise'}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Upgrade to Enterprise</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
