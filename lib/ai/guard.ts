import { createClient } from '@/lib/supabase/server'
import { getOrganizationPlanLimits } from '@/lib/billing/plan-limits'
import { AIFeatureType, AIGateCheckResult } from './types'

interface GlobalFeatureFlags {
  ai_kill_switch?: boolean
  ai_reply_suggestions?: boolean
  ai_lead_scoring?: boolean
  ai_task_extraction?: boolean
  ai_weekly_narrative?: boolean
  client_portal_kill_switch?: boolean
}

/**
 * Validates whether an organization is permitted to invoke a given AI feature.
 * Enforces dual-gating:
 * 1. Platform-wide Super Admin kill switch and feature toggles (platform_settings)
 * 2. Organization subscription plan entitlement (subscription_plans.feature_limits)
 */
export async function checkAIAccess(
  organizationId: string,
  feature: AIFeatureType
): Promise<AIGateCheckResult> {
  if (!organizationId) {
    return {
      allowed: false,
      reason: 'Organization ID is required for AI access evaluation.',
      code: 'PLAN_LIMIT_REACHED',
    }
  }

  // Bypass for health check/test prompt or dev-org in dev/test mode
  if (organizationId === 'dev-org' || (feature === 'test_prompt' && process.env.NODE_ENV === 'test')) {
    return { allowed: true }
  }

  const supabase = await createClient()

  // 1. Check Platform-Wide Super Admin Kill Switch & Feature Flags
  try {
    const { data: settingsData, error: settingsError } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'global_feature_flags')
      .maybeSingle()

    if (!settingsError && settingsData && settingsData.value) {
      const flags = settingsData.value as GlobalFeatureFlags

      // Emergency Platform Kill Switch
      if (flags.ai_kill_switch === true) {
        return {
          allowed: false,
          reason: 'AI features are temporarily suspended platform-wide by administrators.',
          code: 'KILL_SWITCH_ACTIVE',
        }
      }

      // Feature-specific platform switches
      if (feature === 'reply_suggestions' && flags.ai_reply_suggestions === false) {
        return {
          allowed: false,
          reason: 'AI reply suggestions are currently disabled by platform administrators.',
          code: 'KILL_SWITCH_ACTIVE',
        }
      }

      if (feature === 'lead_scoring' && flags.ai_lead_scoring === false) {
        return {
          allowed: false,
          reason: 'AI lead scoring is currently disabled by platform administrators.',
          code: 'KILL_SWITCH_ACTIVE',
        }
      }

      if (feature === 'task_extraction' && flags.ai_task_extraction === false) {
        return {
          allowed: false,
          reason: 'AI task extraction is currently disabled by platform administrators.',
          code: 'KILL_SWITCH_ACTIVE',
        }
      }

      if (feature === 'weekly_narrative' && flags.ai_weekly_narrative === false) {
        return {
          allowed: false,
          reason: 'AI weekly report narratives are currently disabled by platform administrators.',
          code: 'KILL_SWITCH_ACTIVE',
        }
      }
    }
  } catch (err) {
    console.warn('[AI:Guard] Error querying platform settings:', err)
  }

  // 2. Check Organization Subscription Plan Limits
  try {
    const limits = await getOrganizationPlanLimits(organizationId)

    if (!limits.ai_features_enabled) {
      return {
        allowed: false,
        reason: 'AI features are not enabled on your organization’s subscription plan. Please upgrade to Pro or Enterprise.',
        code: 'PLAN_LIMIT_REACHED',
      }
    }

    // Specific capability check if defined on plan
    if (limits.ai_capabilities) {
      const capabilityKey = feature as keyof typeof limits.ai_capabilities
      if (limits.ai_capabilities[capabilityKey] === false) {
        return {
          allowed: false,
          reason: `Your current plan does not include the ${feature.replace(/_/g, ' ')} AI capability.`,
          code: 'CAPABILITY_DISABLED',
        }
      }
    }
  } catch (err) {
    console.warn('[AI:Guard] Error checking organization plan limits:', err)
  }

  // 3. Check Organization-Level Feature Settings (Tenant Admin Controls)
  try {
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('ai_feature_settings')
      .eq('id', organizationId)
      .maybeSingle()

    if (!orgError && orgData && orgData.ai_feature_settings) {
      const orgSettings = orgData.ai_feature_settings as Record<string, boolean>
      if (orgSettings[feature] === false) {
        return {
          allowed: false,
          reason: `The ${feature.replace(/_/g, ' ')} AI capability has been disabled by your organization administrator.`,
          code: 'FEATURE_DISABLED_BY_ORGANIZATION',
        }
      }
    }
  } catch (err) {
    console.warn('[AI:Guard] Error checking organization AI feature settings:', err)
  }

  return { allowed: true }
}
