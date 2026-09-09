import { createClient } from '@/lib/supabase/server'

export interface FeatureLimits {
  max_team_members: number
  max_clients: number
  max_projects: number
  storage_limit_gb: number
  client_portal_enabled: boolean
  ai_features_enabled: boolean
  ai_capabilities?: {
    reply_suggestions?: boolean
    lead_scoring?: boolean
    task_extraction?: boolean
    weekly_narrative?: boolean
  }
  communication_channels_included: number
  analytics_level: string
}

export interface LimitCheckResult {
  allowed: boolean
  currentCount: number
  maxLimit: number
  reason?: string
}

export async function getOrganizationPlanLimits(organizationId: string): Promise<FeatureLimits> {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select(`
      subscription_plans (
        feature_limits
      )
    `)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (subscription && subscription.subscription_plans) {
    const plans = Array.isArray(subscription.subscription_plans)
      ? subscription.subscription_plans[0]
      : subscription.subscription_plans
    return plans.feature_limits as FeatureLimits
  }

  // Default fallback limits (Starter Tier)
  return {
    max_team_members: 5,
    max_clients: 25,
    max_projects: 50,
    storage_limit_gb: 10,
    client_portal_enabled: true,
    ai_features_enabled: false,
    communication_channels_included: 1,
    analytics_level: 'basic',
  }
}

export async function checkTeamMemberLimit(organizationId: string): Promise<LimitCheckResult> {
  const supabase = await createClient()
  const limits = await getOrganizationPlanLimits(organizationId)

  const { count } = await supabase
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const currentCount = count || 0
  const allowed = currentCount < limits.max_team_members

  return {
    allowed,
    currentCount,
    maxLimit: limits.max_team_members,
    reason: allowed ? undefined : `Organization limit reached (${limits.max_team_members} team members). Please upgrade your plan.`,
  }
}

export async function checkClientLimit(organizationId: string): Promise<LimitCheckResult> {
  const supabase = await createClient()
  const limits = await getOrganizationPlanLimits(organizationId)

  const { count } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const currentCount = count || 0
  const allowed = currentCount < limits.max_clients

  return {
    allowed,
    currentCount,
    maxLimit: limits.max_clients,
    reason: allowed ? undefined : `Client limit reached (${limits.max_clients} clients). Please upgrade your plan.`,
  }
}

export async function checkProjectLimit(organizationId: string): Promise<LimitCheckResult> {
  const supabase = await createClient()
  const limits = await getOrganizationPlanLimits(organizationId)

  const { count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const currentCount = count || 0
  const allowed = currentCount < limits.max_projects

  return {
    allowed,
    currentCount,
    maxLimit: limits.max_projects,
    reason: allowed ? undefined : `Project limit reached (${limits.max_projects} active projects). Please upgrade your plan.`,
  }
}

export async function isAIFeatureAllowed(
  organizationId: string,
  capability: 'reply_suggestions' | 'lead_scoring' | 'task_extraction' | 'weekly_narrative'
): Promise<boolean> {
  const limits = await getOrganizationPlanLimits(organizationId)

  if (!limits.ai_features_enabled) {
    return false
  }

  if (limits.ai_capabilities) {
    return !!limits.ai_capabilities[capability]
  }

  return limits.ai_features_enabled
}
