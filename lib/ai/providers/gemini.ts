import { AICompletionRequest, AICompletionResponse } from '../types'
import { calculateEstimatedCost } from '../usage'

export async function executeGeminiCompletion(
  request: AICompletionRequest
): Promise<AICompletionResponse> {
  const startTime = Date.now()

  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY
  const model = process.env.AI_MODEL || 'gemini-1.5-flash'

  if (!apiKey) {
    return {
      success: false,
      content: '',
      provider: 'gemini',
      model,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
      latencyMs: Date.now() - startTime,
      error: 'Google Gemini API key is missing. Configure AI_API_KEY or GEMINI_API_KEY in server environment.',
      errorCode: 'PROVIDER_ERROR',
    }
  }

  try {
    const systemMessage = request.messages.find((m) => m.role === 'system')?.content
    const nonSystemMessages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const payload: Record<string, any> = {
      contents: nonSystemMessages,
      generationConfig: {
        temperature: request.temperature ?? 0.3,
        maxOutputTokens: request.maxTokens ?? 1024,
      },
    }

    if (systemMessage) {
      payload.systemInstruction = {
        parts: [{ text: systemMessage }],
      }
    }

    if (request.responseFormat === 'json') {
      payload.generationConfig.responseMimeType = 'application/json'
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
        provider: 'gemini',
        model,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
        latencyMs: Date.now() - startTime,
        error: `Gemini API returned HTTP ${res.status}: ${errorText}`,
        errorCode: 'PROVIDER_ERROR',
      }
    }

    const data = await res.json()
    const candidate = data.candidates?.[0]
    const content = candidate?.content?.parts?.[0]?.text || ''
    const promptTokens = data.usageMetadata?.promptTokenCount || 0
    const completionTokens = data.usageMetadata?.candidatesTokenCount || 0
    const totalTokens = data.usageMetadata?.totalTokenCount || promptTokens + completionTokens
    const estimatedCost = calculateEstimatedCost('gemini', model, promptTokens, completionTokens)

    return {
      success: true,
      content,
      provider: 'gemini',
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
      provider: 'gemini',
      model,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
      latencyMs: Date.now() - startTime,
      error: err.name === 'AbortError' ? 'Gemini request timed out after 30 seconds' : err.message,
      errorCode: 'PROVIDER_ERROR',
    }
  }
}
