'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { generateAICompletion, isAIAccessible, getAIProviderConfig } from '@/lib/ai/client'
import { getOrganizationAIUsageSummary } from '@/lib/ai/usage'
import { buildTestPrompt } from '@/lib/ai/prompts'
import { AIFeatureType } from '@/lib/ai/types'

export async function testAICompletionAction(promptMessage: string = 'Hello AI assistant') {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { success: false, error: 'Unauthorized: No active organization session.' }
    }

    const orgId = session.organization.id
    const messages = buildTestPrompt(promptMessage)

    const response = await generateAICompletion({
      organizationId: orgId,
      userId: session.user?.id || null,
      feature: 'test_prompt',
      messages,
      temperature: 0.3,
    })

    return response
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'An error occurred while testing AI completion.',
    }
  }
}

export async function checkAIAccessAction(feature: AIFeatureType) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { allowed: false, reason: 'No active session' }
    }

    return await isAIAccessible(session.organization.id, feature)
  } catch (err: any) {
    return { allowed: false, reason: err.message }
  }
}

export async function getAIUsageAction(days: number = 30) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { error: 'Unauthorized' }
    }

    const summary = await getOrganizationAIUsageSummary(session.organization.id, days)
    const providerConfig = getAIProviderConfig()

    return {
      success: true,
      summary,
      config: providerConfig,
    }
  } catch (err: any) {
    return { error: err.message }
  }
}
