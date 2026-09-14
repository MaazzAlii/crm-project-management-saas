import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { PlatformSettingsForm, type PlanItem } from '@/components/super-admin/platform-settings-form'
import { Sliders, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperAdminSettingsPage() {
  await requireSuperAdmin()
  const supabase = await createClient()

  let plans: PlanItem[] = []
  let flags: any = undefined
  let defaults: any = undefined

  try {
    // 1. Fetch Subscription Plans
    const { data: plansData } = await supabase
      .from('subscription_plans')
      .select('id, name, price_monthly, feature_limits')
      .order('price_monthly', { ascending: true })

    if (plansData && plansData.length > 0) {
      plans = plansData as PlanItem[]
    }

    // 2. Fetch Platform Settings (Feature Flags & Onboarding Defaults)
    const { data: settingsData } = await supabase
      .from('platform_settings')
      .select('key, value')

    if (settingsData) {
      settingsData.forEach((row: any) => {
        if (row.key === 'global_feature_flags') flags = row.value
        if (row.key === 'global_onboarding_defaults') defaults = row.value
      })
    }
  } catch (err) {
    console.warn('[SUPER_ADMIN_SETTINGS] Using fallback data:', err)
  }

  if (plans.length === 0) {
    plans = [
      {
        id: 'plan_starter',
        name: 'Starter Plan',
        price_monthly: 29,
        feature_limits: {
          max_team_members: 5,
          max_clients: 25,
          max_projects: 50,
          storage_limit_gb: 10,
          client_portal_enabled: true,
          ai_features_enabled: false,
          communication_channels_included: 1,
          analytics_level: 'basic',
        },
      },
      {
        id: 'plan_pro',
        name: 'Pro Plan',
        price_monthly: 79,
        feature_limits: {
          max_team_members: 15,
          max_clients: 100,
          max_projects: 250,
          storage_limit_gb: 50,
          client_portal_enabled: true,
          ai_features_enabled: true,
          ai_capabilities: {
            reply_suggestions: true,
            lead_scoring: true,
            task_extraction: true,
            weekly_narrative: false,
          },
          communication_channels_included: 3,
          analytics_level: 'advanced',
        },
      },
      {
        id: 'plan_enterprise',
        name: 'Enterprise Plan',
        price_monthly: 199,
        feature_limits: {
          max_team_members: 9999,
          max_clients: 9999,
          max_projects: 9999,
          storage_limit_gb: 500,
          client_portal_enabled: true,
          ai_features_enabled: true,
          ai_capabilities: {
            reply_suggestions: true,
            lead_scoring: true,
            task_extraction: true,
            weekly_narrative: true,
          },
          communication_channels_included: 5,
          analytics_level: 'full_custom',
        },
      },
    ]
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Platform Settings & Global Configuration
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
              <Sliders className="h-3.5 w-3.5" />
              TASK 20
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Centralized platform control. Edit subscription plan limits, toggle feature flags, and configure onboarding defaults without redeploying code.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-300 border border-emerald-500/20">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Super Admin Privileges Verified
        </div>
      </div>

      {/* Main Settings Form */}
      <PlatformSettingsForm
        initialPlans={plans}
        initialFlags={flags}
        initialDefaults={defaults}
      />
    </div>
  )
}
