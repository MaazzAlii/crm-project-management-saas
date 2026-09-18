import { AIChatMessage } from '../types'

export interface ReplySuggestionInput {
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
  preferredTone?: 'professional' | 'friendly' | 'direct' | 'all'
}

/**
 * Builds system and user prompt for Task 44 — Inbox Reply Suggestions.
 * Respects communication channel type (WhatsApp vs Email vs Slack) and client communication mode (manual vs connected).
 */
export function buildReplySuggestionsPrompt(input: ReplySuggestionInput): AIChatMessage[] {
  const isManual = input.communicationMode === 'manual'
  const channelLower = (input.channel || 'email').toLowerCase()

  let channelGuidance = 'General business communication.'
  if (channelLower === 'whatsapp') {
    channelGuidance = 'WhatsApp channel: Keep responses concise, warm, mobile-friendly, and conversational. Avoid lengthy formal paragraphs.'
  } else if (channelLower === 'slack' || channelLower === 'discord') {
    channelGuidance = 'Slack/Discord channel: Fast-paced, collaborative, clear next steps, lightweight formatting.'
  } else if (channelLower === 'email') {
    channelGuidance = 'Email channel: Well-structured paragraphs, professional greeting and sign-off, clear agenda or status.'
  } else if (channelLower === 'upwork') {
    channelGuidance = 'Upwork channel: Professional client-contractor tone, milestone and deliverable focused, transparent timelines.'
  }

  const modeGuidance = isManual
    ? 'Client Communication Mode is MANUAL: Suggestions will be reviewed as drafts by the account team to edit and manually log or copy to external channels. Keep copy self-contained, clear, and easy to copy-paste.'
    : 'Client Communication Mode is CONNECTED: Suggestions will be sent directly through the connected channel integration upon human approval. Ensure tone feels native and immediate for the platform.'

  const systemPrompt = `You are an executive client communications assistant for ${
    input.agencyName || 'a premier digital agency'
  }.
Your goal is to suggest 3 distinct, context-aware reply options for an incoming client message.

Channel Guidelines:
${channelGuidance}

Workflow Mode:
${modeGuidance}

Instructions:
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
Communication Mode: ${input.communicationMode || 'connected'}

Recent Conversation History:
${threadHistory || 'No previous messages.'}

Generate 3 context-aware reply suggestions now in the specified JSON format.`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}
