import { AIChatMessage } from '../types'

export interface TaskExtractionInput {
  messageBody: string
  senderName: string
  clientName?: string
  projectName?: string
  channel?: string
  currentDate?: string
}

export interface ExtractedTaskSuggestion {
  id?: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  suggestedDueDate?: string | null // YYYY-MM-DD format if date mentioned
  suggestedAssignee?: string | null // e.g. "Frontend Developer", "Account Manager", "Billing Lead"
  confidenceScore: number // 0-100 percentage
  sourceSnippet?: string // The specific client sentence that triggered this task
  estimatedHours?: number
}

export interface TaskExtractionResult {
  tasks: ExtractedTaskSuggestion[]
}

/**
 * Builds system and user prompt for Task 46 — Auto-Task Extraction from Messages.
 * Evaluates message for actionable client requests, due dates, assignees, and priority.
 */
export function buildTaskExtractionPrompt(input: TaskExtractionInput): AIChatMessage[] {
  const referenceDate = input.currentDate || new Date().toISOString().split('T')[0]

  const systemPrompt = `You are an enterprise AI project management intelligence assistant.
Your goal is to parse client communications, detect actionable to-dos, deliverables, and requests, and extract structured task candidates.

Today's reference date is: ${referenceDate}

Extraction Criteria:
1. "title": Action-oriented imperative title (e.g. "Send updated project invoice", "Update mobile navigation CTA")
2. "description": Contextual explanation, requirements, and deliverables extracted from the message
3. "priority": "low" | "medium" | "high" | "urgent" based on client sentiment, deadlines, and urgency words (e.g. "ASAP", "urgent", "by Friday")
4. "suggestedDueDate": Calculate concrete YYYY-MM-DD date based on relative terms ("by Friday", "by tomorrow", "next Monday", "by end of week", "by Nov 15") relative to ${referenceDate}. If no date or timeframe is specified, return null.
5. "suggestedAssignee": Suggest the most relevant functional role (e.g. "Billing / Finance", "Frontend Developer", "UI/UX Designer", "Account Manager", "QA Engineer")
6. "confidenceScore": Integer between 0 and 100 indicating confidence that this represents a genuine action item (e.g. 85-98 for explicit requests like "please send X", 60-80 for soft suggestions, 0 for general chatter)
7. "sourceSnippet": The exact sentence or clause from the client's message that triggered this task
8. "estimatedHours": Realistic agency hours (e.g. 1, 2, 4, 8)

Critical Rules:
- If the message contains purely courtesy greetings, feedback with no action required, or small talk, return an empty list: {"tasks": []}.
- Never invent tasks that have no basis in the message text.
- Return between 0 and 3 candidate tasks maximum.
- Output strictly valid JSON matching this schema:
{
  "tasks": [
    {
      "title": "Send updated project invoice",
      "description": "Client requested invoice for milestone 2 deliverables.",
      "priority": "high",
      "suggestedDueDate": "2026-09-25",
      "suggestedAssignee": "Billing / Finance",
      "confidenceScore": 95,
      "sourceSnippet": "send me the invoice by Friday",
      "estimatedHours": 1
    }
  ]
}`

  const userPrompt = `Client: ${input.clientName || 'Agency Client'}
Sender: ${input.senderName}
Associated Project: ${input.projectName || 'General Workspace'}
Channel: ${input.channel || 'Direct Message'}

Client Message:
"""
${input.messageBody}
"""

Extract all actionable tasks into the specified JSON format:`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}
