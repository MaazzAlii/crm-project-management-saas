import { AIChatMessage } from '../types'

export interface LeadScoringInput {
  leadName: string
  company?: string | null
  dealValue?: number | null
  source?: string | null
  currentStage?: string | null
  notes?: string | null
  recentInteractions?: Array<{
    date: string
    channel: string
    summary: string
  }>
}

/**
 * Builds system and user prompt for Task 45 — CRM Lead Scoring in Sales Pipeline.
 */
export function buildLeadScoringPrompt(input: LeadScoringInput): AIChatMessage[] {
  const systemPrompt = `You are an enterprise CRM sales qualification and revenue operations intelligence assistant.
Your goal is to evaluate a sales lead and compute an objective qualification score (0–100) based on standard BANT (Budget, Authority, Need, Timeline) criteria and interaction signals.

Scoring Tiers:
- Hot (75–100): Clear budget, urgent timeline, decision maker engaged, high conversion probability.
- Warm (45–74): Valid interest, but needs timeline clarification, budget confirmation, or multi-stakeholder buy-in.
- Cold (0–44): Disengaged, speculative inquiry, mismatched budget, or inactive communication.

Output strictly valid JSON matching this schema:
{
  "score": 85,
  "tier": "hot",
  "summary": "Brief executive rationale summarizing lead health",
  "factors": [
    { "factor": "Factor Name", "impact": "positive", "description": "Details" }
  ],
  "recommendedAction": "Concrete immediate next action for account executive"
}`

  const interactions = (input.recentInteractions || [])
    .map((int) => `- [${int.date}] via ${int.channel}: ${int.summary}`)
    .join('\n')

  const userPrompt = `Lead Name: ${input.leadName}
Company: ${input.company || 'Not specified'}
Estimated Deal Value: ${input.dealValue ? `$${input.dealValue.toLocaleString()}` : 'Unset'}
Acquisition Source: ${input.source || 'Direct Outreach'}
Pipeline Stage: ${input.currentStage || 'New Inquiry'}

Internal Notes:
${input.notes || 'No internal notes provided.'}

Recent Interaction Touchpoints:
${interactions || 'No recorded touchpoints yet.'}

Evaluate this lead and return the qualification score and breakdown in the specified JSON schema.`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}
