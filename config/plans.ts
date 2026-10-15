/**
 * =============================================================================
 * Innoventix Platform — Plan Rules & Seat Limit Configuration
 * =============================================================================
 * 
 * CORE RULES:
 * 1. Free users get the full platform. Only team size and pending invites are limited.
 * 2. Limits are enforced on the server only. Hidden buttons are not security.
 * 3. Changing a number here changes the limit everywhere.
 * 
 * =============================================================================
 */

export type PlanId = 'free' | 'pro' | 'enterprise' | 'lifetime'

export interface PlanConfig {
  id: PlanId
  name: string
  priceMonthlyUsd: number | null
  maxMembers: number // Seats including the workspace owner
  maxPendingInvites: number
  maxClients: number
  maxProjects: number
  maxChannels: number
  maxAIRequestsMonthly: number
  clientPortalEnabled: boolean
  emailIntegrationEnabled: boolean
  ssoEnabled?: boolean
  auditLogsEnabled?: boolean
  apiAccessEnabled?: boolean
  canUseAllFeatures: boolean // Free gets full platform core CRM
  features: string[] // List of features displayed in the upgrade UI
}

export const ENTERPRISE_QUOTAS = {
  maxMembers: 500,
  maxPendingInvites: 500,
  maxClients: 999999,
  maxProjects: 999999,
  maxChannels: 999,
  maxAIRequestsMonthly: 10000,
  clientPortalEnabled: true,
  emailIntegrationEnabled: true,
  ssoEnabled: true,
  auditLogsEnabled: true,
  apiAccessEnabled: true,
  canUseAllFeatures: true,
} as const

export const ENTERPRISE_FEATURES = [
  'Up to 500 team members',
  'Up to 500 pending invitations',
  'Unlimited clients & projects',
  '999 connected communication channels',
  '10,000 monthly AI requests',
  'Single Sign-On (SSO)',
  'Enterprise audit log export',
  'Direct API access',
  'Dedicated account manager',
  'Custom domain & branding options',
  'Custom SLA guarantees',
  'Tailored security and audit compliance',
]

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthlyUsd: 0,
    maxMembers: 3,
    maxPendingInvites: 2,
    maxClients: 5,
    maxProjects: 3,
    maxChannels: 1,
    maxAIRequestsMonthly: 25,
    clientPortalEnabled: false,
    emailIntegrationEnabled: false,
    ssoEnabled: false,
    auditLogsEnabled: false,
    apiAccessEnabled: false,
    canUseAllFeatures: true,
    features: [
      'Up to 3 team members',
      'Up to 2 pending invitations',
      'Up to 5 clients & 3 projects',
      '1 connected communication channel',
      '25 monthly AI requests',
      'Full CRM & pipeline management',
      'Unified communication hub',
      'Custom automations and webhooks',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthlyUsd: 35,
    maxMembers: 15,
    maxPendingInvites: 20,
    maxClients: 100,
    maxProjects: 50,
    maxChannels: 3,
    maxAIRequestsMonthly: 500,
    clientPortalEnabled: true,
    emailIntegrationEnabled: true,
    ssoEnabled: false,
    auditLogsEnabled: false,
    apiAccessEnabled: false,
    canUseAllFeatures: true,
    features: [
      'Up to 15 team members',
      'Up to 20 pending invitations',
      'Up to 100 clients & 50 projects',
      '3 connected communication channels',
      '500 monthly AI requests',
      'Client portal access',
      'Email integration & priority delivery',
      'Full CRM & pipeline management',
      'Advanced executive analytics & reporting',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthlyUsd: null, // Contact sales
    ...ENTERPRISE_QUOTAS,
    features: ENTERPRISE_FEATURES,
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime VIP',
    priceMonthlyUsd: null, // Lifetime grant
    ...ENTERPRISE_QUOTAS,
    features: ENTERPRISE_FEATURES,
  },
}

/**
 * Helper to fetch plan configuration by slug or tier ID
 */
export function getPlanConfig(planId?: string | null): PlanConfig {
  if (!planId) return PLANS.free
  const normalized = planId.toLowerCase()
  if (normalized === 'lifetime' || normalized === 'vip' || normalized === 'lifetime_vip') {
    return PLANS.lifetime
  }
  if (normalized === 'enterprise' || normalized === 'agency') {
    return PLANS.enterprise
  }
  if (normalized === 'pro' || normalized === 'starter' || normalized === 'professional') {
    return PLANS.pro
  }
  return PLANS.free
}
