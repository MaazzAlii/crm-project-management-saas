/**
 * Developer Fallback & Bypass Utilities
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * Every export in this module is strictly gated so it is impossible to trigger
 * in production (process.env.NODE_ENV === 'production').
 *
 * In addition to non-production environments, authentication and org bypasses
 * require an explicit opt-in flag: process.env.ALLOW_DEV_AUTH_BYPASS === 'true'.
 */

export const DEV_ORG_UUID = '00000000-0000-0000-0000-000000000001'
export const DEV_USER_UUID = '00000000-0000-0000-0000-000000000000'

/**
 * Validates whether development auth bypasses are permitted.
 * Returns true ONLY when:
 * 1. NODE_ENV is NOT 'production'
 * 2. ALLOW_DEV_AUTH_BYPASS === 'true'
 */
export function isDevAuthBypassAllowed(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_DEV_AUTH_BYPASS === 'true'
  )
}

/**
 * Validates whether an organization UUID should trigger dev-only mock paths.
 * Must NOT rely on the UUID alone; always strictly requires non-production
 * and isDevAuthBypassAllowed().
 */
export function isDevOrg(orgId?: string | null): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false
  }
  return isDevAuthBypassAllowed() && orgId === DEV_ORG_UUID
}

/**
 * Returns mock session context for dev super admin.
 * Only accessible in non-production when dev auth bypass is explicitly enabled.
 */
export function getDevSessionContext() {
  if (!isDevAuthBypassAllowed()) {
    return null
  }
  return {
    user: {
      id: DEV_USER_UUID,
      email: 'dev_admin@innoventixhub.com',
      full_name: 'Dev Super Admin',
      avatar_url: null,
    },
    organization: {
      id: DEV_ORG_UUID,
      name: 'Innoventix Hub Agency',
      slug: 'innoventix-hub',
      plan_tier: 'agency_pro',
      billing_status: 'active',
    },
    userOrganizations: [
      {
        id: DEV_ORG_UUID,
        name: 'Innoventix Hub Agency',
        slug: 'innoventix-hub',
        role: 'owner',
      },
    ],
    role: 'owner',
    isSuperAdmin: true,
  }
}
