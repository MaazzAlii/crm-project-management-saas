'use server'

import { query } from '@/lib/db'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export interface CompleteOnboardingInput {
  organizationId: string
  industryType: string
  teamEmails?: string[]
  planSlug?: string
}

export async function completeOnboarding(input: CompleteOnboardingInput) {
  const session = await getCurrentSessionContext()
  if (!session || !session.user || !session.organization) {
    return { success: false, error: 'Unauthorized' }
  }

  const canManage = session.role === 'owner' || session.role === 'admin' || session.isSuperAdmin
  if (!canManage) {
    return { success: false, error: 'Forbidden. Only organization owners and admins can complete onboarding.' }
  }

  const { organizationId: requestedOrgId, industryType } = input
  if (requestedOrgId && requestedOrgId !== session.organization.id) {
    return { success: false, error: 'Organization not found' }
  }

  const orgId = session.organization.id

  try {
    await query(
      `UPDATE organizations
       SET industry_type = $1,
           onboarding_completed = true,
           updated_at = NOW()
       WHERE id = $2`,
      [industryType, orgId]
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('[ONBOARDING_ERROR]', err)
    return { success: false, error: err.message || 'Failed to complete onboarding' }
  }
}
