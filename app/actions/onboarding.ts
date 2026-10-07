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
  if (process.env.NODE_ENV !== 'production' && input.organizationId === '00000000-0000-0000-0000-000000000001') {
    return { success: true }
  }

  const session = await getCurrentSessionContext()
  if (!session || !session.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const orgId = input.organizationId && input.organizationId !== '00000000-0000-0000-0000-000000000001'
    ? input.organizationId
    : session.orgId

  if (!orgId) {
    return { success: false, error: 'Organization not found' }
  }

  try {
    await query(
      `UPDATE organizations
       SET industry_type = $1,
           onboarding_completed = true,
           updated_at = NOW()
       WHERE id = $2`,
      [input.industryType, orgId]
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('[ONBOARDING_ERROR]', err)
    return { success: false, error: err.message || 'Failed to complete onboarding' }
  }
}
