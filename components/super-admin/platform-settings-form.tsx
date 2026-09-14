'use client'

import { useState } from 'react'
import {
  updatePlanLimitsAction,
  updateGlobalFeatureFlagsAction,
  updateGlobalOnboardingDefaultsAction,
  type FeatureFlagsInput,
  type OnboardingDefaultsInput,
} from '@/app/actions/platform-settings'
import {
  Sliders,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Code2,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Settings2,
} from 'lucide-react'

export interface PlanItem {
  id: string
  name: string
  price_monthly: number
  feature_limits: any
}

interface PlatformSettingsFormProps {
  initialPlans: PlanItem[]
  initialFlags?: FeatureFlagsInput
  initialDefaults?: OnboardingDefaultsInput
}

export function PlatformSettingsForm({
  initialPlans,
  initialFlags,
  initialDefaults,
}: PlatformSettingsFormProps) {
  const [plans, setPlans] = useState<PlanItem[]>(initialPlans)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editedPrice, setEditedPrice] = useState<number>(0)
  const [editedJson, setEditedJson] = useState<string>('')
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null)

  const [flags, setFlags] = useState<FeatureFlagsInput>(
    initialFlags || {
      ai_kill_switch: false,
      ai_reply_suggestions: true,
      ai_lead_scoring: true,
      ai_task_extraction: true,
      ai_weekly_narrative: true,
      client_portal_kill_switch: false,
    }
  )
  const [savingFlags, setSavingFlags] = useState(false)

  const [defaults, setDefaults] = useState<OnboardingDefaultsInput>(
    initialDefaults || {
      default_trial_days: 14,
      auto_create_sample_projects: true,
      default_plan_tier: 'starter',
    }
  )
  const [savingDefaults, setSavingDefaults] = useState(false)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Plan Edit Handlers
  const handleEditPlan = (plan: PlanItem) => {
    setEditingPlanId(plan.id)
    setEditedPrice(plan.price_monthly)
    setEditedJson(JSON.stringify(plan.feature_limits, null, 2))
    setMessage(null)
  }

  const handleSavePlan = async (planId: string) => {
    setSavingPlanId(planId)
    setMessage(null)

    const res = await updatePlanLimitsAction({
      planId,
      priceMonthly: Number(editedPrice),
      featureLimitsJson: editedJson,
    })

    if (res.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: res.message || 'Plan updated successfully.' })
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? {
                ...p,
                price_monthly: Number(editedPrice),
                feature_limits: JSON.parse(editedJson),
              }
            : p
        )
      )
      setEditingPlanId(null)
    }
    setSavingPlanId(null)
  }

  // Feature Flags Save
  const handleSaveFlags = async () => {
    setSavingFlags(true)
    setMessage(null)

    const res = await updateGlobalFeatureFlagsAction(flags)
    if (res.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: res.message || 'Feature flags updated.' })
    }
    setSavingFlags(false)
  }

  // Onboarding Defaults Save
  const handleSaveDefaults = async () => {
    setSavingDefaults(true)
    setMessage(null)

    const res = await updateGlobalOnboardingDefaultsAction(defaults)
    if (res.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: res.message || 'Onboarding defaults updated.' })
    }
    setSavingDefaults(false)
  }

  return (
    <div className="space-y-10">
      {/* Alert Notification */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-sm font-medium transition ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* SECTION 1: Subscription Plans Management */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-purple-400" />
              Subscription Plans & Limit Definitions
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Edit price tiers and feature limits JSON. Changes apply immediately to tenant limit checks without redeploying code.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isEditing = editingPlanId === plan.id
            const isSaving = savingPlanId === plan.id

            return (
              <div
                key={plan.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl transition hover:border-slate-700"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-lg font-bold text-white uppercase tracking-wider">
                      {plan.name}
                    </span>
                    <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
                      ${plan.price_monthly}/mo
                    </span>
                  </div>

                  {!isEditing ? (
                    <div className="space-y-3">
                      <div className="text-2xl font-extrabold text-white">
                        ${plan.price_monthly}{' '}
                        <span className="text-xs font-normal text-slate-400">/ month</span>
                      </div>

                      <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto max-h-48">
                        <pre>{JSON.stringify(plan.feature_limits, null, 2)}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Monthly Price ($)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="number"
                            min="0"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                          <span>Feature Limits JSON</span>
                          <Code2 className="h-3.5 w-3.5 text-purple-400" />
                        </label>
                        <textarea
                          rows={8}
                          value={editedJson}
                          onChange={(e) => setEditedJson(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  {!isEditing ? (
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
                    >
                      Edit Plan Limits
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSavePlan(plan.id)}
                        disabled={isSaving}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 transition disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingPlanId(null)}
                        disabled={isSaving}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* SECTION 2: Global Feature Flags */}
      <section className="space-y-6 border-t border-slate-800 pt-10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Global Feature Flags & Kill Switches
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Platform-wide toggle controls. Instantly disable AI or Client Portal capabilities platform-wide.
            </p>
          </div>
          <button
            onClick={handleSaveFlags}
            disabled={savingFlags}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition disabled:opacity-50"
          >
            {savingFlags ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Feature Flags
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* AI Platform Kill Switch */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <div className="text-sm font-bold text-white">AI Platform Kill Switch</div>
              <div className="text-xs text-slate-400 mt-0.5">Disable all AI features platform-wide</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_kill_switch: !f.ai_kill_switch }))}
              className="text-amber-400 hover:text-amber-300"
            >
              {flags.ai_kill_switch ? (
                <ToggleRight className="h-8 w-8 text-rose-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>

          {/* AI Reply Suggestions */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <div className="text-sm font-bold text-white">AI Inbox Reply Suggestions</div>
              <div className="text-xs text-slate-400 mt-0.5">Auto-suggest contextual replies</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_reply_suggestions: !f.ai_reply_suggestions }))}
              className="text-purple-400 hover:text-purple-300"
            >
              {flags.ai_reply_suggestions ? (
                <ToggleRight className="h-8 w-8 text-purple-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>

          {/* AI Lead Scoring */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <div className="text-sm font-bold text-white">AI Lead Scoring Engine</div>
              <div className="text-xs text-slate-400 mt-0.5">Automatic win probability calculation</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_lead_scoring: !f.ai_lead_scoring }))}
              className="text-purple-400 hover:text-purple-300"
            >
              {flags.ai_lead_scoring ? (
                <ToggleRight className="h-8 w-8 text-purple-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>

          {/* AI Task Extraction */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <div className="text-sm font-bold text-white">AI Message Task Extraction</div>
              <div className="text-xs text-slate-400 mt-0.5">Extract tasks from client conversations</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_task_extraction: !f.ai_task_extraction }))}
              className="text-purple-400 hover:text-purple-300"
            >
              {flags.ai_task_extraction ? (
                <ToggleRight className="h-8 w-8 text-purple-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>

          {/* AI Weekly Narrative */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <div className="text-sm font-bold text-white">AI Weekly Summary Narrative</div>
              <div className="text-xs text-slate-400 mt-0.5">Generate executive progress reports</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_weekly_narrative: !f.ai_weekly_narrative }))}
              className="text-purple-400 hover:text-purple-300"
            >
              {flags.ai_weekly_narrative ? (
                <ToggleRight className="h-8 w-8 text-purple-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>

          {/* Client Portal Kill Switch */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <div className="text-sm font-bold text-white">Client Portal Global Kill Switch</div>
              <div className="text-xs text-slate-400 mt-0.5">Disable external client access</div>
            </div>
            <button
              onClick={() =>
                setFlags((f) => ({ ...f, client_portal_kill_switch: !f.client_portal_kill_switch }))
              }
              className="text-amber-400 hover:text-amber-300"
            >
              {flags.client_portal_kill_switch ? (
                <ToggleRight className="h-8 w-8 text-rose-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: Global Onboarding Defaults */}
      <section className="space-y-6 border-t border-slate-800 pt-10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-400" />
              Global Onboarding Defaults
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configuration applied to newly registered tenant organizations.
            </p>
          </div>
          <button
            onClick={handleSaveDefaults}
            disabled={savingDefaults}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
          >
            {savingDefaults ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
            <label className="block text-xs font-bold text-white">Default Trial Period (Days)</label>
            <input
              type="number"
              min="1"
              max="90"
              value={defaults.default_trial_days}
              onChange={(e) => setDefaults((d) => ({ ...d, default_trial_days: Number(e.target.value) }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">Duration of free trial granted upon tenant creation.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
            <label className="block text-xs font-bold text-white">Default Tier for New Signups</label>
            <select
              value={defaults.default_plan_tier}
              onChange={(e) => setDefaults((d) => ({ ...d, default_plan_tier: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="starter">Starter Plan ($29/mo)</option>
              <option value="pro">Pro Plan ($79/mo)</option>
              <option value="enterprise">Enterprise Plan ($199/mo)</option>
            </select>
            <p className="text-[11px] text-slate-400">Initial tier assigned before billing activation.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Auto-Provision Sample Workspace Data</div>
              <p className="text-[11px] text-slate-400 mt-1">Seed sample project & task templates into new tenant</p>
            </div>
            <button
              onClick={() =>
                setDefaults((d) => ({
                  ...d,
                  auto_create_sample_projects: !d.auto_create_sample_projects,
                }))
              }
              className="text-blue-400 hover:text-blue-300"
            >
              {defaults.auto_create_sample_projects ? (
                <ToggleRight className="h-8 w-8 text-blue-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
