import { AICompletionRequest, AICompletionResponse } from '../types'
import { calculateEstimatedCost } from '../usage'

export async function executeAnthropicCompletion(
  request: AICompletionRequest
): Promise<AICompletionResponse> {
  const startTime = Date.now()

  const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY
  const model = process.env.AI_MODEL || 'claude-3-5-sonnet-20241022'

  if (!apiKey) {
    return {
      success: false,
      content: '',
      provider: 'anthropic',
      model,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
      latencyMs: Date.now() - startTime,
      error: 'Anthropic API key is missing. Configure AI_API_KEY or ANTHROPIC_API_KEY in server environment.',
      errorCode: 'PROVIDER_ERROR',
    }
  }

  try {
    const systemMessage = request.messages.find((m) => m.role === 'system')?.content
    const nonSystemMessages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))

    const payload: Record<string, any> = {
      model,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.3,
      messages: nonSystemMessages,
    }

    if (systemMessage) {
      payload.system = systemMessage
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
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
        provider: 'anthropic',
        model,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
        latencyMs: Date.now() - startTime,
        error: `Anthropic API returned HTTP ${res.status}: ${errorText}`,
        errorCode: 'PROVIDER_ERROR',
      }
    }

    const data = await res.json()
    const content = data.content?.[0]?.text || ''
    const promptTokens = data.usage?.input_tokens || 0
    const completionTokens = data.usage?.output_tokens || 0
    const totalTokens = promptTokens + completionTokens
    const estimatedCost = calculateEstimatedCost('anthropic', model, promptTokens, completionTokens)

    return {
      success: true,
      content,
      provider: 'anthropic',
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
      provider: 'anthropic',
      model,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
      latencyMs: Date.now() - startTime,
      error: err.name === 'AbortError' ? 'Anthropic request timed out after 30 seconds' : err.message,
      errorCode: 'PROVIDER_ERROR',
    }
  }
}
