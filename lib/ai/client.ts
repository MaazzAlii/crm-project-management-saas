import { checkAIAccess } from './guard'
import { logAIUsage } from './usage'
import { executeMockCompletion } from './providers/mock'
import { executeOpenAICompletion } from './providers/openai'
import { executeAnthropicCompletion } from './providers/anthropic'
import { executeGeminiCompletion } from './providers/gemini'
import {
  AICompletionRequest,
  AICompletionResponse,
  AIProviderType,
  AIFeatureType,
} from './types'

/**
 * Resolves the currently active AI provider based on environment configuration.
 * Defaults to 'mock' if no external provider is explicitly configured or missing keys.
 */
export function resolveAIProvider(): AIProviderType {
  const envProvider = (process.env.AI_PROVIDER || '').trim().toLowerCase()

  if (envProvider === 'openai') return 'openai'
  if (envProvider === 'anthropic') return 'anthropic'
  if (envProvider === 'gemini') return 'gemini'
  if (envProvider === 'mock') return 'mock'

  // Auto-detect based on available keys if AI_PROVIDER is not set
  if (process.env.OPENAI_API_KEY || process.env.AI_API_KEY?.startsWith('sk-')) {
    return 'openai'
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return 'anthropic'
  }
  if (process.env.GEMINI_API_KEY) {
    return 'gemini'
  }

  // Safe deterministic default for local development, CI, and test environments
  return 'mock'
}

/**
 * Returns active provider configuration metadata (safe for UI/diagnostics, no secrets).
 */
export function getAIProviderConfig() {
  const provider = resolveAIProvider()
  const model =
    process.env.AI_MODEL ||
    (provider === 'openai'
      ? 'gpt-4o-mini'
      : provider === 'anthropic'
      ? 'claude-3-5-sonnet'
      : provider === 'gemini'
      ? 'gemini-1.5-flash'
      : 'mock-agent-v1')

  return {
    provider,
    model,
    isMock: provider === 'mock',
  }
}

/**
 * Public helper to verify if an organization is permitted to access a given AI feature.
 */
export async function isAIAccessible(
  organizationId: string,
  feature: AIFeatureType
): Promise<{ allowed: boolean; reason?: string }> {
  const gate = await checkAIAccess(organizationId, feature)
  return { allowed: gate.allowed, reason: gate.reason }
}

/**
 * Unified, provider-agnostic entry point for all AI feature invocations.
 *
 * Sequence:
 * 1. Evaluates Dual Gating (Super Admin Kill Switch + Tenant Plan Limits)
 * 2. Routes to active provider adapter (OpenAI, Anthropic, Gemini, or Mock)
 * 3. Asynchronously records token consumption and cost metrics in public.ai_usage_log
 * 4. Returns normalized AICompletionResponse
 */
export async function generateAICompletion(
  request: AICompletionRequest
): Promise<AICompletionResponse> {
  const startTime = Date.now()

  // 1. Dual Gating Check
  const gateResult = await checkAIAccess(request.organizationId, request.feature)
  if (!gateResult.allowed) {
    // Log blocked attempt for auditing
    await logAIUsage({
      organizationId: request.organizationId,
      userId: request.userId,
      feature: request.feature,
      provider: 'system',
      model: 'gatekeeper',
      tokensUsed: 0,
      estimatedCost: 0,
      status: 'blocked',
      metadata: { reason: gateResult.reason, code: gateResult.code },
    })

    return {
      success: false,
      content: '',
      provider: 'mock',
      model: 'system-gatekeeper',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
      latencyMs: Date.now() - startTime,
      error: gateResult.reason,
      errorCode: gateResult.code,
    }
  }

  // 2. Dispatch to resolved provider
  const provider = resolveAIProvider()
  let response: AICompletionResponse

  switch (provider) {
    case 'openai':
      response = await executeOpenAICompletion(request)
      break
    case 'anthropic':
      response = await executeAnthropicCompletion(request)
      break
    case 'gemini':
      response = await executeGeminiCompletion(request)
      break
    case 'mock':
    default:
      response = await executeMockCompletion(request)
      break
  }

  // 3. Log usage metrics to database
  await logAIUsage({
    organizationId: request.organizationId,
    userId: request.userId,
    feature: request.feature,
    provider: response.provider,
    model: response.model,
    promptTokens: response.usage.promptTokens,
    completionTokens: response.usage.completionTokens,
    tokensUsed: response.usage.totalTokens,
    estimatedCost: response.usage.estimatedCost,
    status: response.success ? 'success' : 'error',
    metadata: {
      latencyMs: response.latencyMs,
      error: response.error,
      ...request.metadata,
    },
  })

  return response
}
