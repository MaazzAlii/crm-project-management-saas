'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { getOrganizationPlanLimits } from '@/lib/billing/plan-limits'
import { logAuditEvent } from '@/lib/audit/logger'
import { AIFeatureSettings } from '@/lib/ai/types'

export interface FeatureUsageStats {
  feature: keyof AIFeatureSettings
  label: string
  description: string
  totalCalls: number
  totalTokens: number
  estimatedCost: number
  enabled: boolean
  planAllowed: boolean
  platformAllowed: boolean
}

export interface AIFeatureSettingsData {
  canEdit: boolean
  settings: AIFeatureSettings
  platformKillSwitch: boolean
  planAIEnabled: boolean
  monthlyTotals: {
    totalCalls: number
    totalTokens: number
    estimatedCost: number
    period: string
  }
  features: FeatureUsageStats[]
}

const DEFAULT_SETTINGS: AIFeatureSettings = {
  reply_suggestions: true,
  lead_scoring: true,
  task_extraction: true,
  weekly_narrative: true,
}

const FEATURE_METADATA: Record<
  keyof AIFeatureSettings,
  { label: string; description: string }
> = {
  reply_suggestions: {
    label: 'Inbox Reply Suggestions',
    description:
      'AI analyzes communication context to generate three draft responses aligned with tone and communication channel.',
  },
  lead_scoring: {
    label: 'CRM Lead Scoring',
    description:
      'Multi-factor AI scoring analyzing deal value, pipeline velocity, client engagement, and historical project metrics.',
  },
  task_extraction: {
    label: 'Auto-Task Extraction',
    description:
      'Identifies action items and deliverables in client messages with human-in-the-loop review before task creation.',
  },
  weekly_narrative: {
    label: 'Weekly Report Narratives',
    description:
      'Generates multi-paragraph executive summaries highlighting wins, risks, and upcoming priorities for team reports.',
  },
}

export async function fetchAIFeatureSettingsAction(): Promise<{
  success: boolean
  data?: AIFeatureSettingsData
  error?: string
}> {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.user || !session.organization) {
      return { success: false, error: 'Unauthorized: Active organization session required.' }
    }

    const orgId = session.organization.id
    const canEdit =
      session.role === 'owner' || session.role === 'admin' || session.isSuperAdmin === true

    const supabase = await createClient()

    // 1. Fetch organization AI feature settings
    const { data: orgData } = await supabase
      .from('organizations')
      .select('ai_feature_settings')
      .eq('id', orgId)
      .maybeSingle()

    const rawSettings = (orgData?.ai_feature_settings as Partial<AIFeatureSettings>) || {}
    const settings: AIFeatureSettings = {
      reply_suggestions: rawSettings.reply_suggestions !== false,
      lead_scoring: rawSettings.lead_scoring !== false,
      task_extraction: rawSettings.task_extraction !== false,
      weekly_narrative: rawSettings.weekly_narrative !== false,
    }

    // 2. Fetch platform global feature flags & kill switches
    let platformKillSwitch = false
    const platformFeatureFlags: Record<string, boolean> = {}

    try {
      const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'global_feature_flags')
        .maybeSingle()

      if (settingsData && settingsData.value) {
        const flags = settingsData.value as Record<string, boolean>
        platformKillSwitch = flags.ai_kill_switch === true
        platformFeatureFlags.reply_suggestions = flags.ai_reply_suggestions !== false
        platformFeatureFlags.lead_scoring = flags.ai_lead_scoring !== false
        platformFeatureFlags.task_extraction = flags.ai_task_extraction !== false
        platformFeatureFlags.weekly_narrative = flags.ai_weekly_narrative !== false
      }
    } catch (err) {
      console.warn('[AI Settings] Failed to load platform flags:', err)
    }

    // 3. Fetch plan limits
    let planAIEnabled = true
    let planCapabilities: Record<string, boolean> = {}

    try {
      const limits = await getOrganizationPlanLimits(orgId)
      planAIEnabled = limits.ai_features_enabled
      if (limits.ai_capabilities) {
        planCapabilities = limits.ai_capabilities as Record<string, boolean>
      }
    } catch (err) {
      console.warn('[AI Settings] Failed to load plan limits:', err)
    }

    // 4. Query monthly usage log statistics
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodLabel = startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

    const { data: logsData, error: logsError } = await supabase
      .from('ai_usage_log')
      .select('feature, tokens_used, estimated_cost, status, created_at')
      .eq('organization_id', orgId)
      .gte('created_at', startOfMonth.toISOString())

    const logs = (!logsError && logsData) ? logsData : []

    let totalCalls = logs.length
    let totalTokens = 0
    let totalCost = 0

    const featureStatsMap: Record<
      string,
      { totalCalls: number; totalTokens: number; estimatedCost: number }
    > = {
      reply_suggestions: { totalCalls: 0, totalTokens: 0, estimatedCost: 0 },
      lead_scoring: { totalCalls: 0, totalTokens: 0, estimatedCost: 0 },
      task_extraction: { totalCalls: 0, totalTokens: 0, estimatedCost: 0 },
      weekly_narrative: { totalCalls: 0, totalTokens: 0, estimatedCost: 0 },
    }

    for (const log of logs) {
      const tokens = Number(log.tokens_used) || 0
      const cost = Number(log.estimated_cost) || 0
      totalTokens += tokens
      totalCost += cost

      const fKey = log.feature as keyof typeof featureStatsMap
      if (featureStatsMap[fKey]) {
        featureStatsMap[fKey].totalCalls += 1
        featureStatsMap[fKey].totalTokens += tokens
        featureStatsMap[fKey].estimatedCost += cost
      }
    }

    const featureKeys: (keyof AIFeatureSettings)[] = [
      'reply_suggestions',
      'lead_scoring',
      'task_extraction',
      'weekly_narrative',
    ]

    const features: FeatureUsageStats[] = featureKeys.map((key) => {
      const meta = FEATURE_METADATA[key]
      const stats = featureStatsMap[key] || { totalCalls: 0, totalTokens: 0, estimatedCost: 0 }
      const platformAllowed = !platformKillSwitch && (platformFeatureFlags[key] !== false)
      const planAllowed = planAIEnabled && (planCapabilities[key] !== false)

      return {
        feature: key,
        label: meta.label,
        description: meta.description,
        totalCalls: stats.totalCalls,
        totalTokens: stats.totalTokens,
        estimatedCost: stats.estimatedCost,
        enabled: settings[key],
        planAllowed,
        platformAllowed,
      }
    })

    return {
      success: true,
      data: {
        canEdit,
        settings,
        platformKillSwitch,
        planAIEnabled,
        monthlyTotals: {
          totalCalls,
          totalTokens,
          estimatedCost: totalCost,
          period: periodLabel,
        },
        features,
      },
    }
  } catch (error: any) {
    console.error('[AI Settings] Error in fetchAIFeatureSettingsAction:', error)
    return {
      success: false,
      error: error?.message || 'Failed to load AI feature settings',
    }
  }
}

export async function updateAIFeatureToggleAction(
  feature: keyof AIFeatureSettings,
  enabled: boolean
): Promise<{
  success: boolean
  settings?: AIFeatureSettings
  error?: string
}> {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.user || !session.organization) {
      return { success: false, error: 'Unauthorized: Active organization session required.' }
    }

    const canEdit =
      session.role === 'owner' || session.role === 'admin' || session.isSuperAdmin === true
    if (!canEdit) {
      return {
        success: false,
        error: 'Forbidden: Only organization owners and administrators can configure AI features.',
      }
    }

    const validFeatures: (keyof AIFeatureSettings)[] = [
      'reply_suggestions',
      'lead_scoring',
      'task_extraction',
      'weekly_narrative',
    ]
    if (!validFeatures.includes(feature)) {
      return { success: false, error: 'Invalid AI feature identifier.' }
    }

    const orgId = session.organization.id
    const supabase = await createClient()

    // 1. Fetch current settings
    const { data: orgData, error: fetchError } = await supabase
      .from('organizations')
      .select('ai_feature_settings')
      .eq('id', orgId)
      .single()

    if (fetchError) {
      return { success: false, error: 'Failed to retrieve current organization settings.' }
    }

    const currentSettings = (orgData?.ai_feature_settings as Partial<AIFeatureSettings>) || {
      ...DEFAULT_SETTINGS,
    }

    const updatedSettings: AIFeatureSettings = {
      ...DEFAULT_SETTINGS,
      ...currentSettings,
      [feature]: Boolean(enabled),
    }

    // 2. Persist updated settings to organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        ai_feature_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)

    if (updateError) {
      console.error('[AI Settings] Update error:', updateError)
      return { success: false, error: 'Failed to persist feature toggle changes.' }
    }

    // 3. Log audit event
    await logAuditEvent({
      actorId: session.user.id,
      action: 'AI_FEATURE_TOGGLE_UPDATED',
      targetType: 'organization',
      targetId: orgId,
      details: {
        feature,
        enabled,
        actorEmail: session.user.email,
        updatedAt: new Date().toISOString(),
      },
    })

    revalidatePath('/settings/ai')

    return {
      success: true,
      settings: updatedSettings,
    }
  } catch (error: any) {
    console.error('[AI Settings] Error updating AI feature toggle:', error)
    return {
      success: false,
      error: error?.message || 'Unexpected error modifying AI feature state.',
    }
  }
}
