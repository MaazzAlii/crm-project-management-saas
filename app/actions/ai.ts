'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { requireRole } from '@/lib/auth/server-guard'
import { generateAICompletion, isAIAccessible, getAIProviderConfig } from '@/lib/ai/client'
import { getOrganizationAIUsageSummary } from '@/lib/ai/usage'
import { buildTestPrompt } from '@/lib/ai/prompts'
import { AIFeatureType } from '@/lib/ai/types'

export async function testAICompletionAction(promptMessage: string = 'Hello AI assistant') {
  const session = await requireRole(['owner', 'admin', 'member'])

  try {
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
    if (err.message === 'UNAUTHENTICATED' || err.message === 'INSUFFICIENT_ROLE' || err.message === 'NOT_FOUND') {
      throw err
    }
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
