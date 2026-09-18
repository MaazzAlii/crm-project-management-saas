import { AIChatMessage } from '../types'

export interface ReplySuggestionInput {
  clientName?: string
  clientCompany?: string
  channel: string
  conversationHistory: Array<{
    sender: string
    body: string
    isClient: boolean
    sentAt: string
  }>
  agencyName?: string
  preferredTone?: 'professional' | 'friendly' | 'direct' | 'all'
}

/**
 * Builds system and user prompt for Task 44 — Inbox Reply Suggestions.
 */
export function buildReplySuggestionsPrompt(input: ReplySuggestionInput): AIChatMessage[] {
  const systemPrompt = `You are an executive client communications assistant for ${
    input.agencyName || 'a premier digital agency'
  }.
Your goal is to suggest 3 distinct, context-aware reply options for an incoming client message.

Guidelines:
1. Suggest exactly 3 responses tailored to the channel (${input.channel}):
   - Option 1 (Professional & Formal): Reassuring, polished, clear next steps.
   - Option 2 (Collaborative & Warm): Friendly, relationship-building, inviting.
   - Option 3 (Direct & Concise): Brief, action-oriented, efficient.
2. Maintain high agency professionalism without over-promising or providing unverified technical commitments.
3. If the client asked a question requiring investigation, acknowledge receipt and commit to a follow-up timeframe.
4. Output strictly valid JSON matching this schema:
{
  "suggestions": [
    { "tone": "Professional", "text": "..." },
    { "tone": "Collaborative", "text": "..." },
    { "tone": "Direct", "text": "..." }
  ]
}`

  const threadHistory = input.conversationHistory
    .slice(-6)
    .map((msg) => `[${msg.sentAt}] ${msg.sender}: ${msg.body}`)
    .join('\n')

  const userPrompt = `Client: ${input.clientName || 'Valued Client'}${
    input.clientCompany ? ` (${input.clientCompany})` : ''
  }
Channel: ${input.channel}

Recent Conversation History:
${threadHistory || 'No previous messages.'}

Generate 3 context-aware reply suggestions now in the specified JSON format.`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}
