import { generateAICompletion } from '../client'
import {
  buildTaskExtractionPrompt,
  TaskExtractionInput,
  ExtractedTaskSuggestion,
  TaskExtractionResult,
} from '../prompts/task-extraction'
import { AIProviderType } from '../types'

export interface ExtractTasksParams {
  organizationId: string
  userId?: string | null
  messageBody: string
  senderName?: string
  clientName?: string
  projectName?: string
  channel?: string
  currentDate?: string
}

export interface ExtractTasksResponse {
  success: boolean
  tasks: ExtractedTaskSuggestion[]
  error?: string
  errorCode?: string
  provider?: AIProviderType
  model?: string
  latencyMs?: number
}

/**
 * Robustly parses AI JSON output for task extraction, stripping any Markdown formatting.
 */
function parseExtractionOutput(raw: string): TaskExtractionResult {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed.tasks)) {
      return {
        tasks: parsed.tasks.map((t: any, index: number) => ({
          id: `task-sugg-${Date.now()}-${index}`,
          title: String(t.title || 'Untitled Task').trim(),
          description: String(t.description || '').trim(),
          priority: ['low', 'medium', 'high', 'urgent'].includes(t.priority)
            ? t.priority
            : 'medium',
          suggestedDueDate: t.suggestedDueDate || null,
          suggestedAssignee: t.suggestedAssignee || null,
          confidenceScore: typeof t.confidenceScore === 'number'
            ? Math.max(0, Math.min(100, Math.round(t.confidenceScore)))
            : 85,
          sourceSnippet: t.sourceSnippet || undefined,
          estimatedHours: typeof t.estimatedHours === 'number' ? t.estimatedHours : undefined,
        })),
      }
    }
  } catch (err) {
    console.warn('[AI:TaskExtraction] Failed primary JSON parse:', err)
  }

  // Regex fallback if JSON contains formatting errors
  try {
    const jsonMatch = raw.match(/\{[\s\S]*"tasks"[\s\S]*\}/)
    if (jsonMatch) {
      const fallbackParsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(fallbackParsed.tasks)) {
        return {
          tasks: fallbackParsed.tasks.map((t: any, index: number) => ({
            id: `task-sugg-${Date.now()}-${index}`,
            title: String(t.title || 'Untitled Task').trim(),
            description: String(t.description || '').trim(),
            priority: ['low', 'medium', 'high', 'urgent'].includes(t.priority)
              ? t.priority
              : 'medium',
            suggestedDueDate: t.suggestedDueDate || null,
            suggestedAssignee: t.suggestedAssignee || null,
            confidenceScore: typeof t.confidenceScore === 'number'
              ? Math.max(0, Math.min(100, Math.round(t.confidenceScore)))
              : 80,
            sourceSnippet: t.sourceSnippet || undefined,
            estimatedHours: typeof t.estimatedHours === 'number' ? t.estimatedHours : undefined,
          })),
        }
      }
    }
  } catch (e) {
    console.error('[AI:TaskExtraction] Fallback JSON parse failed:', e)
  }

  return { tasks: [] }
}

/**
 * Analyzes communication messages and extracts actionable tasks.
 * Enforces dual-gating and accounts token usage in ai_usage_log.
 */
export async function extractTasksFromMessage(
  params: ExtractTasksParams
): Promise<ExtractTasksResponse> {
  const {
    organizationId,
    userId,
    messageBody,
    senderName = 'Client',
    clientName,
    projectName,
    channel,
    currentDate,
  } = params

  if (!messageBody || !messageBody.trim()) {
    return {
      success: true,
      tasks: [],
    }
  }

  const promptInput: TaskExtractionInput = {
    messageBody,
    senderName,
    clientName,
    projectName,
    channel,
    currentDate,
  }

  const messages = buildTaskExtractionPrompt(promptInput)

  const completion = await generateAICompletion({
    organizationId,
    userId,
    feature: 'task_extraction',
    messages,
    responseFormat: 'json',
    temperature: 0.2,
    maxTokens: 750,
    metadata: {
      clientName,
      senderName,
      channel,
      messageLength: messageBody.length,
    },
  })

  if (!completion.success) {
    return {
      success: false,
      tasks: [],
      error: completion.error || 'Failed to extract actionable tasks from message.',
      errorCode: completion.errorCode,
      provider: completion.provider,
      model: completion.model,
      latencyMs: completion.latencyMs,
    }
  }

  const extraction = parseExtractionOutput(completion.content)

  return {
    success: true,
    tasks: extraction.tasks,
    provider: completion.provider,
    model: completion.model,
    latencyMs: completion.latencyMs,
  }
}
