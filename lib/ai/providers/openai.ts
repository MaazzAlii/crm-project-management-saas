import { AICompletionRequest, AICompletionResponse } from '../types'
import { calculateEstimatedCost } from '../usage'

export async function executeOpenAICompletion(
  request: AICompletionRequest
): Promise<AICompletionResponse> {
  const startTime = Date.now()

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.AI_MODEL || 'gpt-4o-mini'

  if (!apiKey) {
    return {
      success: false,
      content: '',
      provider: 'openai',
      model,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
      latencyMs: Date.now() - startTime,
      error: 'OpenAI API key is missing. Configure AI_API_KEY or OPENAI_API_KEY in server environment.',
      errorCode: 'PROVIDER_ERROR',
    }
  }

  try {
    const payload: Record<string, any> = {
      model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 1024,
    }

    if (request.responseFormat === 'json') {
      payload.response_format = { type: 'json_object' }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const errorText = await res.text()
      return {
        success: false,
        content: '',
        provider: 'openai',
        model,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
        latencyMs: Date.now() - startTime,
        error: `OpenAI API returned HTTP ${res.status}: ${errorText}`,
        errorCode: 'PROVIDER_ERROR',
      }
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ''
    const promptTokens = data.usage?.prompt_tokens || 0
    const completionTokens = data.usage?.completion_tokens || 0
    const totalTokens = data.usage?.total_tokens || promptTokens + completionTokens
    const estimatedCost = calculateEstimatedCost('openai', model, promptTokens, completionTokens)

    return {
      success: true,
      content,
      provider: 'openai',
      model,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
      },
      latencyMs: Date.now() - startTime,
    }
  } catch (err: any) {
    return {
      success: false,
      content: '',
      provider: 'openai',
      model,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
      latencyMs: Date.now() - startTime,
      error: err.name === 'AbortError' ? 'OpenAI request timed out after 30 seconds' : err.message,
      errorCode: 'PROVIDER_ERROR',
    }
  }
}
