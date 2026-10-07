'use server'

import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { query } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface PlanUpdateInput {
  planId: string
  priceMonthly: number
  featureLimitsJson: string
}

export interface FeatureFlagsInput {
  ai_kill_switch: boolean
  ai_reply_suggestions: boolean
  ai_lead_scoring: boolean
  ai_task_extraction: boolean
  ai_weekly_narrative: boolean
  client_portal_kill_switch: boolean
}

export interface OnboardingDefaultsInput {
  default_trial_days: number
  auto_create_sample_projects: boolean
  default_plan_tier: string
}

export async function updatePlanLimitsAction(input: PlanUpdateInput) {
  await requireSuperAdmin()

  const { planId, priceMonthly, featureLimitsJson } = input

  if (!planId) {
    return { error: 'Plan ID is required.' }
  }

  if (typeof priceMonthly !== 'number' || priceMonthly < 0) {
    return { error: 'Monthly price must be a non-negative number.' }
  }

  // Server-side JSON schema validation
  let parsedLimits: any
  try {
    parsedLimits = JSON.parse(featureLimitsJson)
  } catch {
    return { error: 'Invalid JSON format for feature limits.' }
  }

  // Validate required FeatureLimits fields
  const requiredKeys = [
    'max_team_members',
    'max_clients',
    'max_projects',
    'storage_limit_gb',
    'client_portal_enabled',
    'ai_features_enabled',
  ]

  for (const key of requiredKeys) {
    if (parsedLimits[key] === undefined) {
      return {
        error: `Missing required key '${key}' in feature limits JSON structure.`,
      }
    }
  }

  if (
    typeof parsedLimits.max_team_members !== 'number' ||
    typeof parsedLimits.max_clients !== 'number' ||
    typeof parsedLimits.max_projects !== 'number'
  ) {
    return { error: 'Numeric limits (max_team_members, max_clients, max_projects) must be numbers.' }
  }

  try {
    await query(
      `UPDATE subscription_plans
       SET price_monthly = $1, feature_limits = $2, updated_at = NOW()
       WHERE id = $3`,
      [priceMonthly, JSON.stringify(parsedLimits), planId]
    )

    revalidatePath('/super-admin/settings')
    revalidatePath('/super-admin/organizations')
    return { success: true, message: 'Subscription plan updated successfully.' }
  } catch (err: any) {
    return { error: err.message || 'Failed to persist plan updates.' }
  }
}

export async function updateGlobalFeatureFlagsAction(flags: FeatureFlagsInput) {
  await requireSuperAdmin()

  try {
    await query(
      `INSERT INTO platform_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()`,
      ['global_feature_flags', JSON.stringify(flags)]
    )

    revalidatePath('/super-admin/settings')
    return { success: true, message: 'Global feature flags updated successfully.' }
  } catch (err: any) {
    return { error: err.message || 'Failed to update feature flags.' }
  }
}

export async function updateGlobalOnboardingDefaultsAction(defaults: OnboardingDefaultsInput) {
  await requireSuperAdmin()

  try {
    await query(
      `INSERT INTO platform_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()`,
      ['global_onboarding_defaults', JSON.stringify(defaults)]
    )

    revalidatePath('/super-admin/settings')
    return { success: true, message: 'Global onboarding defaults updated successfully.' }
  } catch (err: any) {
    return { error: err.message || 'Failed to update onboarding defaults.' }
  }
}
