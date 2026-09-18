import { generateAICompletion } from '@/lib/ai/client'
import { buildReplySuggestionsPrompt } from '@/lib/ai/prompts/reply-suggestions'

export interface ReplySuggestionItem {
  tone: string
  text: string
}

export interface GetReplySuggestionsParams {
  organizationId: string
  userId?: string
  clientName?: string
  clientCompany?: string
  channel: string
  communicationMode?: 'manual' | 'connected'
  conversationHistory: Array<{
    sender: string
    body: string
    isClient: boolean
    sentAt: string
  }>
  agencyName?: string
}

export interface GetReplySuggestionsResult {
  success: boolean
  suggestions: ReplySuggestionItem[]
  provider?: string
  model?: string
  error?: string
  errorCode?: string
  latencyMs?: number
}

/**
 * Safely parses AI completion text into a typed array of 1-3 reply suggestions.
 */
function parseReplySuggestions(content: string): ReplySuggestionItem[] {
  if (!content || !content.trim()) {
    return []
  }

  // 1. Attempt clean JSON parsing, trimming any Markdown code blocks
  try {
    let cleanText = content.trim()
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    }

    const parsed = JSON.parse(cleanText)
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.suggestions)
      ? parsed.suggestions
      : []

    if (list.length > 0) {
      return list
        .filter((item: any) => item && (item.text || item.body || item.content))
        .slice(0, 3)
        .map((item: any, idx: number) => ({
          tone: item.tone || item.title || (idx === 0 ? 'Professional' : idx === 1 ? 'Collaborative' : 'Direct'),
          text: String(item.text || item.body || item.content).trim(),
        }))
    }
  } catch {
    // Proceed to fallback regex parser below
  }

  // 2. Fallback: Parse numbered or labelled text items
  const fallbackList: ReplySuggestionItem[] = []
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean)

  for (const line of lines) {
    // Match patterns like: "1. Professional: Thank you...", "Option 1 (Collaborative): Hi...", "- Direct: Got it."
    const match = line.match(/^(?:(?:\d+\.|\-|\*)\s*)?(?:(?:Option\s*\d+:?\s*)?\(?([A-Za-z\s]+)\)?:\s*)?(.+)$/i)
    if (match) {
      const toneLabel = (match[1] || '').trim() || (fallbackList.length === 0 ? 'Professional' : fallbackList.length === 1 ? 'Collaborative' : 'Direct')
      const text = match[2].replace(/^["']|["']$/g, '').trim()
      if (text.length > 5) {
        fallbackList.push({ tone: toneLabel, text })
        if (fallbackList.length >= 3) break
      }
    }
  }

  if (fallbackList.length > 0) {
    return fallbackList.slice(0, 3)
  }

  // 3. Last-resort fallback: wrap the raw trimmed content
  return [
    {
      tone: 'Professional',
      text: content.trim(),
    },
  ]
}

/**
 * Generates context-aware, mode-respecting reply suggestions for unified inbox threads.
 *
 * Enforces dual-tier gating (super-admin kill switch + subscription plan limits)
 * and logs token consumption to public.ai_usage_log via generateAICompletion.
 */
export async function getReplySuggestions(
  params: GetReplySuggestionsParams
): Promise<GetReplySuggestionsResult> {
  const messages = buildReplySuggestionsPrompt({
    clientName: params.clientName,
    clientCompany: params.clientCompany,
    channel: params.channel,
    communicationMode: params.communicationMode,
    conversationHistory: params.conversationHistory,
    agencyName: params.agencyName,
  })

  const completion = await generateAICompletion({
    organizationId: params.organizationId,
    userId: params.userId,
    feature: 'reply_suggestions',
    messages,
    responseFormat: 'json',
    temperature: 0.7,
    maxTokens: 600,
    metadata: {
      channel: params.channel,
      communicationMode: params.communicationMode,
      clientName: params.clientName,
      messageCount: params.conversationHistory.length,
    },
  })

  if (!completion.success) {
    return {
      success: false,
      suggestions: [],
      error: completion.error || 'Failed to generate reply suggestions.',
      errorCode: completion.errorCode,
      provider: completion.provider,
      model: completion.model,
      latencyMs: completion.latencyMs,
    }
  }

  const suggestions = parseReplySuggestions(completion.content)

  return {
    success: true,
    suggestions,
    provider: completion.provider,
    model: completion.model,
    latencyMs: completion.latencyMs,
  }
}
