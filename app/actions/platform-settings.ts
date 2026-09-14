'use server'

import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { createAdminClient } from '@/lib/supabase/admin'
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
    const adminClient = createAdminClient()

    const { error: updateError } = await adminClient
      .from('subscription_plans')
      .update({
        price_monthly: priceMonthly,
        feature_limits: parsedLimits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)

    if (updateError) {
      console.error('[PLATFORM_SETTINGS_ACTION] Plan update error:', updateError)
      return { error: `Failed to update plan: ${updateError.message}` }
    }

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
    const adminClient = createAdminClient()

    // Store in platform_settings key-value store or system metadata
    const { error } = await adminClient
      .from('platform_settings')
      .upsert({
        key: 'global_feature_flags',
        value: flags,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.warn('[PLATFORM_SETTINGS_ACTION] DB platform_settings warning:', error.message)
    }

    revalidatePath('/super-admin/settings')
    return { success: true, message: 'Global feature flags updated successfully.' }
  } catch (err: any) {
    return { error: err.message || 'Failed to update feature flags.' }
  }
}

export async function updateGlobalOnboardingDefaultsAction(defaults: OnboardingDefaultsInput) {
  await requireSuperAdmin()

  try {
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('platform_settings')
      .upsert({
        key: 'global_onboarding_defaults',
        value: defaults,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.warn('[PLATFORM_SETTINGS_ACTION] DB onboarding defaults warning:', error.message)
    }

    revalidatePath('/super-admin/settings')
    return { success: true, message: 'Global onboarding defaults updated successfully.' }
  } catch (err: any) {
    return { error: err.message || 'Failed to update onboarding defaults.' }
  }
}
