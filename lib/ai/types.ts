export type AIFeatureType =
  | 'reply_suggestions'
  | 'lead_scoring'
  | 'task_extraction'
  | 'weekly_narrative'
  | 'general'
  | 'test_prompt'

export type AIProviderType = 'mock' | 'openai' | 'anthropic' | 'gemini'

export type AIMessageRole = 'system' | 'user' | 'assistant'

export interface AIChatMessage {
  role: AIMessageRole
  content: string
}

export interface AICompletionRequest {
  organizationId: string
  userId?: string | null
  feature: AIFeatureType
  messages: AIChatMessage[]
  temperature?: number
  maxTokens?: number
  metadata?: Record<string, any>
  responseFormat?: 'text' | 'json'
}

export interface AIUsageMetrics {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCost: number
}

export interface AICompletionResponse {
  success: boolean
  content: string
  provider: AIProviderType
  model: string
  usage: AIUsageMetrics
  latencyMs: number
  error?: string
  errorCode?:
    | 'KILL_SWITCH_ACTIVE'
    | 'PLAN_LIMIT_REACHED'
    | 'CAPABILITY_DISABLED'
    | 'FEATURE_DISABLED_BY_ORGANIZATION'
    | 'PROVIDER_ERROR'
    | 'INVALID_REQUEST'
}

export interface AIGateCheckResult {
  allowed: boolean
  reason?: string
  code?: 'KILL_SWITCH_ACTIVE' | 'PLAN_LIMIT_REACHED' | 'CAPABILITY_DISABLED' | 'FEATURE_DISABLED_BY_ORGANIZATION'
}

export interface AIFeatureSettings {
  reply_suggestions: boolean
  lead_scoring: boolean
  task_extraction: boolean
  weekly_narrative: boolean
}

export interface AIUsageRecord {
  organizationId: string
  userId?: string | null
  feature: AIFeatureType
  provider: string
  model?: string
  promptTokens?: number
  completionTokens?: number
  tokensUsed: number
  estimatedCost?: number
  status: 'success' | 'error' | 'blocked'
  metadata?: Record<string, any>
}

export interface AIModelConfig {
  provider: AIProviderType
  model: string
  apiKey?: string
  baseUrl?: string
}
