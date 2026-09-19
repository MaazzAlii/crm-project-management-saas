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

export interface PlanUsageMetric {
  key: string
  label: string
  current: number
  max: number
  unit?: string
  percentage: number
  status: 'normal' | 'warning' | 'critical' | 'exceeded'
}

export interface OrganizationPlanUsage {
  planName: string
  planSlug: string
  status: string
  priceMonthly: number
  renewsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  limits: FeatureLimits
  metrics: {
    teamMembers: PlanUsageMetric
    clients: PlanUsageMetric
    projects: PlanUsageMetric
    storage: PlanUsageMetric
    channels: PlanUsageMetric
    aiUsage: PlanUsageMetric
  }
  hasWarnings: boolean
  highestProximityPercent: number
  warningCount: number
}

function calculateMetricStatus(current: number, max: number): {
  percentage: number
  status: 'normal' | 'warning' | 'critical' | 'exceeded'
} {
  if (max <= 0) {
    return { percentage: 0, status: 'normal' }
  }
  const percentage = Math.min(Math.round((current / max) * 100), 100)
  let status: 'normal' | 'warning' | 'critical' | 'exceeded' = 'normal'
  if (current >= max) {
    status = 'exceeded'
  } else if (percentage >= 95) {
    status = 'critical'
  } else if (percentage >= 80) {
    status = 'warning'
  }
  return { percentage, status }
}

export async function getOrganizationPlanUsageDetails(
  organizationId: string
): Promise<OrganizationPlanUsage> {
  const supabase = await createClient()

  // 1. Fetch Subscription & Plan Details
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select(`
      id,
      status,
      current_period_end,
      cancel_at_period_end,
      subscription_plans (
        id,
        name,
        slug,
        price_monthly,
        feature_limits
      )
    `)
    .eq('organization_id', organizationId)
    .maybeSingle()

  const rawPlan = subscription?.subscription_plans
  const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan

  const limits: FeatureLimits = (plan?.feature_limits as FeatureLimits) || {
    max_team_members: 5,
    max_clients: 25,
    max_projects: 50,
    storage_limit_gb: 10,
    client_portal_enabled: true,
    ai_features_enabled: false,
    communication_channels_included: 1,
    analytics_level: 'basic',
  }

  // 2. Query Real Resource Counts
  const [
    { count: teamMembersCount },
    { count: clientsCount },
    { count: projectsCount },
    { count: channelsCount },
    { count: aiUsageCount },
  ] = await Promise.all([
    supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    supabase
      .from('communication_channels')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true),
    supabase
      .from('ai_usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ])

  const curTeam = teamMembersCount || 0
  const curClients = clientsCount || 0
  const curProjects = projectsCount || 0
  const curChannels = channelsCount || 0
  const curAi = aiUsageCount || 0

  // Estimated storage: (deliverables count * 25MB + tasks * 1MB + projects * 5MB) / 1024 GB
  const estimatedStorageGb = Math.max(
    0.2,
    Number(((curProjects * 5 + curClients * 2) / 100).toFixed(1))
  )

  const teamStatus = calculateMetricStatus(curTeam, limits.max_team_members)
  const clientStatus = calculateMetricStatus(curClients, limits.max_clients)
  const projectStatus = calculateMetricStatus(curProjects, limits.max_projects)
  const storageStatus = calculateMetricStatus(estimatedStorageGb, limits.storage_limit_gb || 10)
  const channelStatus = calculateMetricStatus(
    curChannels,
    limits.communication_channels_included || 3
  )
  const aiStatus = calculateMetricStatus(curAi, limits.ai_features_enabled ? 500 : 0)

  const metrics = {
    teamMembers: {
      key: 'teamMembers',
      label: 'Team Members',
      current: curTeam,
      max: limits.max_team_members,
      percentage: teamStatus.percentage,
      status: teamStatus.status,
    },
    clients: {
      key: 'clients',
      label: 'Active Clients',
      current: curClients,
      max: limits.max_clients,
      percentage: clientStatus.percentage,
      status: clientStatus.status,
    },
    projects: {
      key: 'projects',
      label: 'Projects',
      current: curProjects,
      max: limits.max_projects,
      percentage: projectStatus.percentage,
      status: projectStatus.status,
    },
    storage: {
      key: 'storage',
      label: 'Cloud Storage',
      current: estimatedStorageGb,
      max: limits.storage_limit_gb || 10,
      unit: 'GB',
      percentage: storageStatus.percentage,
      status: storageStatus.status,
    },
    channels: {
      key: 'channels',
      label: 'Connected Channels',
      current: curChannels,
      max: limits.communication_channels_included || 3,
      percentage: channelStatus.percentage,
      status: channelStatus.status,
    },
    aiUsage: {
      key: 'aiUsage',
      label: 'Monthly AI Requests',
      current: curAi,
      max: limits.ai_features_enabled ? 500 : 0,
      percentage: aiStatus.percentage,
      status: aiStatus.status,
    },
  }

  const allMetrics = Object.values(metrics)
  const warnings = allMetrics.filter((m) => m.status === 'warning' || m.status === 'critical' || m.status === 'exceeded')
  const highestProximityPercent = Math.max(...allMetrics.map((m) => m.percentage))

  return {
    planName: plan?.name || 'Starter Plan',
    planSlug: plan?.slug || 'starter',
    status: subscription?.status || 'active',
    priceMonthly: Number(plan?.price_monthly) || 29,
    renewsAt: subscription?.current_period_end
      ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : null,
    currentPeriodEnd: subscription?.current_period_end || null,
    cancelAtPeriodEnd: !!subscription?.cancel_at_period_end,
    limits,
    metrics,
    hasWarnings: warnings.length > 0,
    highestProximityPercent,
    warningCount: warnings.length,
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
