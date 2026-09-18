import { createClient } from '@/lib/supabase/server'
import { AIUsageRecord } from './types'

/**
 * Calculates rough USD cost based on token counts and model tier.
 */
export function calculateEstimatedCost(
  provider: string,
  model: string = '',
  promptTokens: number = 0,
  completionTokens: number = 0
): number {
  if (provider === 'mock') return 0

  const m = model.toLowerCase()

  // Default OpenAI rates (gpt-4o-mini baseline)
  let inputRatePerM = 0.15
  let outputRatePerM = 0.60

  if (m.includes('gpt-4o') && !m.includes('mini')) {
    inputRatePerM = 2.50
    outputRatePerM = 10.00
  } else if (m.includes('claude-3-5-sonnet') || m.includes('claude-3-sonnet')) {
    inputRatePerM = 3.00
    outputRatePerM = 15.00
  } else if (m.includes('claude-3-5-haiku') || m.includes('claude-3-haiku')) {
    inputRatePerM = 0.80
    outputRatePerM = 4.00
  } else if (m.includes('gemini-1.5-flash')) {
    inputRatePerM = 0.075
    outputRatePerM = 0.30
  } else if (m.includes('gemini-1.5-pro')) {
    inputRatePerM = 1.25
    outputRatePerM = 5.00
  }

  const cost = (promptTokens / 1_000_000) * inputRatePerM + (completionTokens / 1_000_000) * outputRatePerM
  return Number(cost.toFixed(6))
}

/**
 * Persists an AI feature invocation log to ai_usage_log.
 */
export async function logAIUsage(record: AIUsageRecord): Promise<boolean> {
  try {
    const supabase = await createClient()

    const cost = record.estimatedCost !== undefined
      ? record.estimatedCost
      : calculateEstimatedCost(
          record.provider,
          record.model,
          record.promptTokens || 0,
          record.completionTokens || 0
        )

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.organizationId)
    if (!isUuid) {
      return true
    }

    const { error } = await supabase.from('ai_usage_log').insert({
      organization_id: record.organizationId,
      user_id: record.userId || null,
      feature: record.feature,
      provider: record.provider,
      model: record.model || 'default',
      prompt_tokens: record.promptTokens || 0,
      completion_tokens: record.completionTokens || 0,
      tokens_used: record.tokensUsed || 0,
      estimated_cost: cost,
      status: record.status,
      metadata: record.metadata || {},
    })

    if (error) {
      console.warn('[AI:Usage] Failed to log usage in database:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.warn('[AI:Usage] Exception in logAIUsage:', err)
    return false
  }
}

export interface OrganizationAIUsageSummary {
  totalRequests: number
  totalTokens: number
  totalCost: number
  byFeature: Record<string, { requests: number; tokens: number; cost: number }>
}

/**
 * Retrieves aggregate AI usage metrics for an organization.
 */
export async function getOrganizationAIUsageSummary(
  organizationId: string,
  days: number = 30
): Promise<OrganizationAIUsageSummary> {
  const summary: OrganizationAIUsageSummary = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    byFeature: {},
  }

  try {
    const supabase = await createClient()
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('ai_usage_log')
      .select('feature, tokens_used, estimated_cost, status')
      .eq('organization_id', organizationId)
      .gte('created_at', cutoffDate)

    if (error || !data) return summary

    data.forEach((row: any) => {
      summary.totalRequests += 1
      const tokens = row.tokens_used || 0
      const cost = Number(row.estimated_cost) || 0

      summary.totalTokens += tokens
      summary.totalCost += cost

      if (!summary.byFeature[row.feature]) {
        summary.byFeature[row.feature] = { requests: 0, tokens: 0, cost: 0 }
      }

      summary.byFeature[row.feature].requests += 1
      summary.byFeature[row.feature].tokens += tokens
      summary.byFeature[row.feature].cost += cost
    })

    summary.totalCost = Number(summary.totalCost.toFixed(4))
    return summary
  } catch (err) {
    console.error('[AI:Usage] Error calculating usage summary:', err)
    return summary
  }
}
