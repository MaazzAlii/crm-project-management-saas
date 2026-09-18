'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Bot,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Coins,
  Activity,
  MessageSquare,
  CheckSquare,
  FileText,
  HelpCircle,
} from 'lucide-react'
import {
  AIFeatureSettingsData,
  FeatureUsageStats,
  updateAIFeatureToggleAction,
} from '@/app/(dashboard)/settings/ai/actions'
import { AIFeatureSettings } from '@/lib/ai/types'

interface AIFeatureSettingsViewProps {
  initialData: AIFeatureSettingsData
}

const FEATURE_ICONS: Record<keyof AIFeatureSettings, React.ElementType> = {
  reply_suggestions: MessageSquare,
  lead_scoring: TrendingUp,
  task_extraction: CheckSquare,
  weekly_narrative: FileText,
}

export function AIFeatureSettingsView({ initialData }: AIFeatureSettingsViewProps) {
  const [data, setData] = useState<AIFeatureSettingsData>(initialData)
  const [togglingFeature, setTogglingFeature] = useState<keyof AIFeatureSettings | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (featureKey: keyof AIFeatureSettings, currentEnabled: boolean) => {
    if (!data.canEdit || isPending) return

    setErrorMessage(null)
    setSuccessMessage(null)
    setTogglingFeature(featureKey)

    const nextValue = !currentEnabled

    // Optimistic UI update
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [featureKey]: nextValue,
      },
      features: prev.features.map((f) =>
        f.feature === featureKey ? { ...f, enabled: nextValue } : f
      ),
    }))

    startTransition(async () => {
      try {
        const res = await updateAIFeatureToggleAction(featureKey, nextValue)
        if (!res.success) {
          // Revert on failure
          setData((prev) => ({
            ...prev,
            settings: {
              ...prev.settings,
              [featureKey]: currentEnabled,
            },
            features: prev.features.map((f) =>
              f.feature === featureKey ? { ...f, enabled: currentEnabled } : f
            ),
          }))
          setErrorMessage(res.error || 'Failed to update feature state.')
        } else if (res.settings) {
          setData((prev) => ({
            ...prev,
            settings: res.settings!,
          }))
          setSuccessMessage(`Successfully ${nextValue ? 'enabled' : 'disabled'} ${featureKey.replace(/_/g, ' ')}.`)
          setTimeout(() => setSuccessMessage(null), 3000)
        }
      } catch (err: any) {
        // Revert on crash
        setData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            [featureKey]: currentEnabled,
          },
          features: prev.features.map((f) =>
            f.feature === featureKey ? { ...f, enabled: currentEnabled } : f
          ),
        }))
        setErrorMessage(err?.message || 'Network error updating toggle.')
      } finally {
        setTogglingFeature(null)
      }
    })
  }

  const activeCount = data.features.filter((f) => f.enabled && f.planAllowed && f.platformAllowed).length
  const totalCount = data.features.length

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-slate-900/80 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-sm">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">AI Capability Management</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-300 border border-purple-500/30">
                <Sparkles className="h-3 w-3 text-purple-400" />
                Three-Tier Gated
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Configure agency AI features, inspect consumption metrics, and control tenant access policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700/60 px-3.5 py-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-300">
              <strong className="text-white font-semibold">{activeCount}</strong> of {totalCount} Active
            </span>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
          <p className="flex-1">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <p className="flex-1">{successMessage}</p>
        </div>
      )}

      {/* Tier 1 Warning: Platform Kill Switch */}
      {data.platformKillSwitch && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-300">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-200">Platform-Wide AI Emergency Kill Switch Active</h4>
            <p className="mt-0.5 text-xs text-amber-300/80">
              Super administrators have temporarily suspended platform AI operations for maintenance. Tenant settings remain saved but feature execution is currently locked.
            </p>
          </div>
        </div>
      )}

      {/* Tier 2 Warning: Plan Gating */}
      {!data.planAIEnabled && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 shrink-0 text-sky-400" />
            <div>
              <p className="font-semibold text-white">Subscription Plan AI Entitlement</p>
              <p className="text-xs text-sky-300/80">
                AI features require a Pro or Enterprise subscription. Upgrade your plan to activate live AI generation.
              </p>
            </div>
          </div>
          <Link
            href="/settings/billing"
            className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-sky-500/20 hover:bg-sky-500/30 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Upgrade Plan <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Monthly Consumption Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Monthly Usage Consumption ({data.monthlyTotals.period})
          </h3>
          <span className="text-xs text-slate-500">Resets on the 1st of each month</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total Invocations */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total AI Invocations</span>
              <Activity className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">
                {data.monthlyTotals.totalCalls.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">requests</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Combined requests across all AI modules</p>
          </div>

          {/* Token Consumption */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Token Volume</span>
              <Cpu className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">
                {data.monthlyTotals.totalTokens.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">tokens</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Prompt & completion tokens recorded</p>
          </div>

          {/* Estimated Cost */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Estimated Provider Cost</span>
              <Coins className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">
                ${data.monthlyTotals.estimatedCost.toFixed(4)}
              </span>
              <span className="text-xs text-slate-500">USD</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Based on standard multi-tenant model rates</p>
          </div>
        </div>
      </div>

      {/* Feature Toggles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Feature Capabilities & Controls</h3>
            <p className="text-xs text-slate-400">
              Toggle specific AI modules for your organization team members.
            </p>
          </div>
          {!data.canEdit && (
            <span className="text-xs text-slate-500 italic">
              Read-only view (requires Admin or Owner role to edit)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {data.features.map((featureItem) => {
            const IconComponent = FEATURE_ICONS[featureItem.feature] || Sparkles
            const isToggling = togglingFeature === featureItem.feature
            const isPlatformBlocked = !featureItem.platformAllowed
            const isPlanBlocked = !featureItem.planAllowed
            const isDisabled = !data.canEdit || isPlatformBlocked || isPlanBlocked || isPending

            return (
              <div
                key={featureItem.feature}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-5 transition-all ${
                  featureItem.enabled && !isPlatformBlocked && !isPlanBlocked
                    ? 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    : 'border-slate-800/60 bg-slate-900/30 opacity-75'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                      featureItem.enabled && !isPlatformBlocked && !isPlanBlocked
                        ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                        : 'border-slate-800 bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{featureItem.label}</span>
                      {isPlatformBlocked ? (
                        <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          Platform Paused
                        </span>
                      ) : isPlanBlocked ? (
                        <span className="rounded-full bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] font-medium text-sky-400">
                          Plan Upgrade Required
                        </span>
                      ) : featureItem.enabled ? (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                          Disabled
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 max-w-2xl">{featureItem.description}</p>

                    <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-500">
                      <span>Invocations: <strong className="text-slate-300 font-medium">{featureItem.totalCalls}</strong></span>
                      <span>Tokens: <strong className="text-slate-300 font-medium">{featureItem.totalTokens.toLocaleString()}</strong></span>
                      <span>Cost: <strong className="text-slate-300 font-medium">${featureItem.estimatedCost.toFixed(4)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Switch Control */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={featureItem.enabled}
                    disabled={isDisabled}
                    onClick={() => handleToggle(featureItem.feature, featureItem.enabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                      isDisabled ? 'cursor-not-allowed opacity-50' : ''
                    } ${
                      featureItem.enabled && !isPlatformBlocked && !isPlanBlocked
                        ? 'bg-purple-600'
                        : 'bg-slate-700'
                    }`}
                  >
                    <span className="sr-only">Toggle {featureItem.label}</span>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        featureItem.enabled && !isPlatformBlocked && !isPlanBlocked
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Feature Breakdown Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Monthly Feature Breakdown</h4>
            <p className="text-xs text-slate-400">Detailed token and usage tracking by capability</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Capability</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Invocations</th>
                <th className="px-6 py-3 text-right">Token Volume</th>
                <th className="px-6 py-3 text-right">Est. Cost (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.features.map((f) => (
                <tr key={f.feature} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-white flex items-center gap-2">
                    {f.label}
                  </td>
                  <td className="px-6 py-3.5">
                    {f.enabled && f.planAllowed && f.platformAllowed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right text-slate-300 font-mono">
                    {f.totalCalls.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-right text-slate-300 font-mono">
                    {f.totalTokens.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-right text-slate-300 font-mono">
                    ${f.estimatedCost.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help / Architecture Info */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400">
        <HelpCircle className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
        <p>
          <strong className="text-slate-300">Three-Tier Gating Architecture:</strong> AI access is evaluated hierarchically: (1) Super Admin platform kill switch, (2) Organization subscription tier entitlement, and (3) Tenant-level feature toggles configured above. Invocations are metered and audited per multi-tenant security specifications.
        </p>
      </div>
    </div>
  )
}
