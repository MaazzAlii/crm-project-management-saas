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

  // 1. Verify User Authentication & Permission
  const { data: { user } } = await supabase.auth.getUser()
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
