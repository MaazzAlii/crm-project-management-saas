'use client'

import { useState } from 'react'
import { CreditCard, Zap, Check, ArrowUpRight, ShieldCheck, Users, Briefcase, FolderKanban, Loader2 } from 'lucide-react'
import { createCheckoutSession, createCustomerPortalSession } from '@/app/actions/stripe'

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Demo current usage values
  const currentPlan = {
    name: 'Pro Plan',
    status: 'active',
    renewsAt: 'October 15, 2026',
    price: '$79.00 / mo',
  }

  const usage = {
    teamMembers: { count: 6, max: 15 },
    clients: { count: 34, max: 100 },
    projects: { count: 82, max: 250 },
  }

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

  const handleUpgrade = async (priceId: string, planSlug: string) => {
    setLoading(planSlug)
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
              <span>{currentPlan.status}</span>
            </span>
          </div>
          <h2 className="text-3xl font-black text-white">{currentPlan.name}</h2>
          <p className="text-sm text-slate-400">
            {currentPlan.price} &bull; Renews automatically on {currentPlan.renewsAt}
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

      {/* Usage vs Plan Limits */}
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
              <span className="text-slate-400 font-bold">
                {usage.teamMembers.count} / {usage.teamMembers.max}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${(usage.teamMembers.count / usage.teamMembers.max) * 100}%` }}
              />
            </div>
          </div>

          {/* Active Clients */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Active Clients
              </span>
              <span className="text-slate-400 font-bold">
                {usage.clients.count} / {usage.clients.max}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all"
                style={{ width: `${(usage.clients.count / usage.clients.max) * 100}%` }}
              />
            </div>
          </div>

          {/* Active Projects */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <FolderKanban className="w-4 h-4 text-emerald-400" />
                Active Projects
              </span>
              <span className="text-slate-400 font-bold">
                {usage.projects.count} / {usage.projects.max}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${(usage.projects.count / usage.projects.max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Available Tier Upgrade Cards */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-white">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Starter</h4>
              <p className="text-2xl font-black text-white">$29 <span className="text-xs text-slate-400 font-normal">/ mo</span></p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Up to 5 team members</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> 25 active clients</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> 50 projects</li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade('price_starter_monthly', 'starter')}
              disabled={loading === 'starter'}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Downgrade to Starter
            </button>
          </div>

          {/* Pro */}
          <div className="bg-blue-950/30 border-2 border-blue-500/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between relative shadow-xl shadow-blue-500/10">
            <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
              Current Plan
            </span>
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Pro</h4>
              <p className="text-2xl font-black text-white">$79 <span className="text-xs text-slate-400 font-normal">/ mo</span></p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Up to 15 team members</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> 100 active clients</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> AI Reply & Lead Scoring</li>
              </ul>
            </div>
            <button
              disabled
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-blue-400 bg-blue-900/40 border border-blue-800/80 cursor-default"
            >
              Active Workspace Plan
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Enterprise</h4>
              <p className="text-2xl font-black text-white">$199 <span className="text-xs text-slate-400 font-normal">/ mo</span></p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Unlimited team & clients</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> AI Task Extraction & Narratives</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Dedicated VPS Storage</li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade('price_enterprise_monthly', 'enterprise')}
              disabled={loading === 'enterprise'}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Upgrade to Enterprise</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
