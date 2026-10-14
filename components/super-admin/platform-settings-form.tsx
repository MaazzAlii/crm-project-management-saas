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
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' // intentional: success alert style
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" /> // intentional: success alert icon
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* SECTION 1: Subscription Plans Management */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" />
              Subscription Plans & Limit Definitions
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
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
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-border/80"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-lg font-bold text-foreground uppercase tracking-wider">
                      {plan.name}
                    </span>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
                      ${plan.price_monthly}/mo
                    </span>
                  </div>

                  {!isEditing ? (
                    <div className="space-y-3">
                      <div className="text-2xl font-extrabold text-foreground">
                        ${plan.price_monthly}{' '}
                        <span className="text-xs font-normal text-muted-foreground">/ month</span>
                      </div>

                      <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs text-foreground border border-border overflow-x-auto max-h-48">
                        <pre>{JSON.stringify(plan.feature_limits, null, 2)}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Monthly Price ($)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <input
                            type="number"
                            min="0"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(Number(e.target.value))}
                            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1 flex items-center justify-between">
                          <span>Feature Limits JSON</span>
                          <Code2 className="h-3.5 w-3.5 text-primary" />
                        </label>
                        <textarea
                          rows={8}
                          value={editedJson}
                          onChange={(e) => setEditedJson(e.target.value)}
                          className="w-full rounded-lg border border-input bg-background p-3 font-mono text-xs text-foreground focus:border-ring focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  {!isEditing ? (
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="w-full rounded-lg border border-border bg-background py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition shadow-xs"
                    >
                      Edit Plan Limits
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSavePlan(plan.id)}
                        disabled={isSaving}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 shadow-xs"
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
                        className="rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition shadow-xs"
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
      <section className="space-y-6 border-t border-border pt-10">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" /> {/* // intentional: feature flag power icon */}
              Global Feature Flags & Kill Switches
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Platform-wide toggle controls. Instantly disable AI or Client Portal capabilities platform-wide.
            </p>
          </div>
          <button
            onClick={handleSaveFlags}
            disabled={savingFlags}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 shadow-xs"
          >
            {savingFlags ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Feature Flags
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* AI Platform Kill Switch */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs">
            <div>
              <div className="text-sm font-bold text-foreground">AI Platform Kill Switch</div>
              <div className="text-xs text-muted-foreground mt-0.5">Disable all AI features platform-wide</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_kill_switch: !f.ai_kill_switch }))}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {flags.ai_kill_switch ? (
                <ToggleRight className="h-8 w-8 text-destructive" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-muted-foreground/60" />
              )}
            </button>
          </div>

          {/* AI Reply Suggestions */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs">
            <div>
              <div className="text-sm font-bold text-foreground">AI Inbox Reply Suggestions</div>
              <div className="text-xs text-muted-foreground mt-0.5">Auto-suggest contextual replies</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_reply_suggestions: !f.ai_reply_suggestions }))}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {flags.ai_reply_suggestions ? (
                <ToggleRight className="h-8 w-8 text-primary" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-muted-foreground/60" />
              )}
            </button>
          </div>

          {/* AI Lead Scoring */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs">
            <div>
              <div className="text-sm font-bold text-foreground">AI Lead Scoring Engine</div>
              <div className="text-xs text-muted-foreground mt-0.5">Automatic win probability calculation</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_lead_scoring: !f.ai_lead_scoring }))}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {flags.ai_lead_scoring ? (
                <ToggleRight className="h-8 w-8 text-primary" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-muted-foreground/60" />
              )}
            </button>
          </div>

          {/* AI Task Extraction */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs">
            <div>
              <div className="text-sm font-bold text-foreground">AI Message Task Extraction</div>
              <div className="text-xs text-muted-foreground mt-0.5">Extract tasks from client conversations</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_task_extraction: !f.ai_task_extraction }))}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {flags.ai_task_extraction ? (
                <ToggleRight className="h-8 w-8 text-primary" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-muted-foreground/60" />
              )}
            </button>
          </div>

          {/* AI Weekly Narrative */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs">
            <div>
              <div className="text-sm font-bold text-foreground">AI Weekly Summary Narrative</div>
              <div className="text-xs text-muted-foreground mt-0.5">Generate executive progress reports</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_weekly_narrative: !f.ai_weekly_narrative }))}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {flags.ai_weekly_narrative ? (
                <ToggleRight className="h-8 w-8 text-primary" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-muted-foreground/60" />
              )}
            </button>
          </div>

          {/* Client Portal Kill Switch */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs">
            <div>
              <div className="text-sm font-bold text-foreground">Client Portal Global Kill Switch</div>
              <div className="text-xs text-muted-foreground mt-0.5">Disable external client access</div>
            </div>
            <button
              onClick={() =>
                setFlags((f) => ({ ...f, client_portal_kill_switch: !f.client_portal_kill_switch }))
              }
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {flags.client_portal_kill_switch ? (
                <ToggleRight className="h-8 w-8 text-destructive" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-muted-foreground/60" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: Global Onboarding Defaults */}
      <section className="space-y-6 border-t border-border pt-10">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Global Onboarding Defaults
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Configuration applied to newly registered tenant organizations.
            </p>
          </div>
          <button
            onClick={handleSaveDefaults}
            disabled={savingDefaults}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 shadow-xs"
          >
            {savingDefaults ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 space-y-2 shadow-xs">
            <label className="block text-xs font-bold text-card-foreground">Default Trial Period (Days)</label>
            <input
              type="number"
              min="1"
              max="90"
              value={defaults.default_trial_days}
              onChange={(e) => setDefaults((d) => ({ ...d, default_trial_days: Number(e.target.value) }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
            />
            <p className="text-[11px] text-muted-foreground">Duration of free trial granted upon tenant creation.</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-2 shadow-xs">
            <label className="block text-xs font-bold text-card-foreground">Default Tier for New Signups</label>
            <select
              value={defaults.default_plan_tier}
              onChange={(e) => setDefaults((d) => ({ ...d, default_plan_tier: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
            >
              <option value="starter">Starter Plan ($29/mo)</option>
              <option value="pro">Pro Plan ($79/mo)</option>
              <option value="enterprise">Enterprise Plan ($199/mo)</option>
            </select>
            <p className="text-[11px] text-muted-foreground">Initial tier assigned before billing activation.</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs font-bold text-card-foreground">Auto-Provision Sample Workspace Data</div>
              <p className="text-[11px] text-muted-foreground mt-1">Seed sample project & task templates into new tenant</p>
            </div>
            <button
              onClick={() =>
                setDefaults((d) => ({
                  ...d,
                  auto_create_sample_projects: !d.auto_create_sample_projects,
                }))
              }
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {defaults.auto_create_sample_projects ? (
                <ToggleRight className="h-8 w-8 text-primary" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-muted-foreground/60" />
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
