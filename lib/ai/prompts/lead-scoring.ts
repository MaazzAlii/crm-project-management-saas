import { AIChatMessage } from '../types'

export interface LeadScoringInput {
  leadName: string
  company?: string | null
  dealValue?: number | null
  source?: string | null
  currentStage?: string | null
  daysInCurrentStage?: number | null
  totalDaysInPipeline?: number | null
  notes?: string | null
  engagementMetrics?: {
    totalMessages: number
    inboundMessages: number
    outboundMessages: number
    lastContactDaysAgo?: number | null
  }
  projectHistory?: {
    totalProjects: number
    completedProjects: number
    activeProjects: number
    overdueProjects: number
  }
  recentInteractions?: Array<{
    date: string
    channel: string
    summary: string
  }>
}

/**
 * Builds system and user prompt for Task 45 — CRM Lead Scoring in Sales Pipeline.
 * Evaluates 4 dimensions: Deal Value, Stage Progression Speed, Client Engagement, and Project History.
 */
export function buildLeadScoringPrompt(input: LeadScoringInput): AIChatMessage[] {
  const systemPrompt = `You are an enterprise CRM sales qualification and revenue operations intelligence assistant.
Your goal is to evaluate a sales lead and compute an objective qualification score (0–100) based on 4 critical commercial dimensions.

Evaluation Dimensions:
1. Deal Value (Higher value = higher score multiplier): Stated contract value compared to agency baseline ($5k-$25k+).
2. Stage Progression Velocity (Fast progression = higher score): Days spent in current pipeline stage. Rapid advancement signals high momentum; stagnation (>30 days) reduces score.
3. Client Engagement (High message frequency & responsiveness = higher score): Volume of inbound messages, dialogue recency, and response patterns.
4. Project History (Track record): Existing clients with completed projects score highest. New clients start neutral. Overdue projects penalize score.

Tier Scale:
- High (67–100): High-quality prospect with confirmed budget, prompt engagement, and strong momentum.
- Medium (34–66): Medium potential with valid interest, requiring nurture, budget alignment, or timeline confirmation.
- Low (0–33): Low quality lead, low deal value, stagnant stage movement, or uncommunicative client.

Output strictly valid JSON matching this schema:
{
  "score": 82,
  "tier": "high",
  "summary": "Brief executive rationale summarizing lead health and conversion probability",
  "factors": [
    { "factor": "Deal Value", "impact": "positive", "description": "Assessment of budget and contract value" },
    { "factor": "Stage Progression Speed", "impact": "positive", "description": "Assessment of momentum and time in stage" },
    { "factor": "Client Engagement", "impact": "positive", "description": "Assessment of messaging recency and frequency" },
    { "factor": "Project History", "impact": "neutral", "description": "Assessment of past project delivery track record" }
  ],
  "recommendedAction": "Concrete immediate next action for the account executive"
}`

  const interactions = (input.recentInteractions || [])
    .map((int) => `- [${int.date}] via ${int.channel}: ${int.summary}`)
    .join('\n')

  const engagement = input.engagementMetrics
    ? `Total Messages: ${input.engagementMetrics.totalMessages} (Inbound: ${input.engagementMetrics.inboundMessages}, Outbound: ${input.engagementMetrics.outboundMessages}), Last Contact: ${
        input.engagementMetrics.lastContactDaysAgo !== null && input.engagementMetrics.lastContactDaysAgo !== undefined
          ? `${input.engagementMetrics.lastContactDaysAgo} days ago`
          : 'Never'
      }`
    : 'No interaction statistics recorded.'

  const projects = input.projectHistory
    ? `Total Projects: ${input.projectHistory.totalProjects} (Completed: ${input.projectHistory.completedProjects}, Active: ${input.projectHistory.activeProjects}, Overdue: ${input.projectHistory.overdueProjects})`
    : 'No prior project history.'

  const userPrompt = `Lead Name: ${input.leadName}
Company: ${input.company || 'Not specified'}
Estimated Deal Value: ${input.dealValue ? `$${input.dealValue.toLocaleString()}` : 'Unset / $0'}
Acquisition Source: ${input.source || 'Direct Outreach'}
Pipeline Stage: ${input.currentStage || 'new'}
Stage Velocity: ${input.daysInCurrentStage ?? 0} days in current stage (Total Pipeline Time: ${input.totalDaysInPipeline ?? 0} days)

Client Engagement Signals:
${engagement}

Project History Signals:
${projects}

Internal Notes:
${input.notes || 'No internal notes provided.'}

Recent Interaction Touchpoints:
${interactions || 'No recorded touchpoints yet.'}

Evaluate this lead against the 4 dimensions and return the qualification score and breakdown in the specified JSON schema.`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}
