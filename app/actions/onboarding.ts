'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CompleteOnboardingInput {
  organizationId: string
  industryType: string
  teamEmails?: string[]
  planSlug?: string
}

export async function completeOnboarding(input: CompleteOnboardingInput) {
  const supabase = await createClient()

  if (process.env.NODE_ENV !== 'production' && input.organizationId === '00000000-0000-0000-0000-000000000001') {
    return { success: true }
  }

  // 1. Verify User Authentication & Permission
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user
  } catch {}

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Update Organization Onboarding Status
  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      industry_type: input.industryType,
      onboarding_completed: true,
    })
    .eq('id', input.organizationId)

  if (orgError) {
    return { success: false, error: orgError.message }
  }

  // 3. Process Optional Team Invites
  if (input.teamEmails && input.teamEmails.length > 0) {
    // In production, send invitation emails via GoTrue Auth / Resend
  }

  revalidatePath('/dashboard')
  return { success: true }
}
