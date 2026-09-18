import { createClient } from '@/lib/supabase/server'
import { generateAICompletion } from '@/lib/ai/client'
import { buildLeadScoringPrompt, LeadScoringInput } from '@/lib/ai/prompts/lead-scoring'

export interface LeadScoreFactor {
  factor: string
  impact: 'positive' | 'negative' | 'neutral'
  description: string
  weight?: number
}

export interface LeadScoreBreakdown {
  score: number // 0-100
  tier: 'high' | 'medium' | 'low'
  summary: string
  factors: LeadScoreFactor[]
  recommendedAction: string
  calculatedAt: string
}

export interface ScoreLeadParams {
  clientId: string
  organizationId: string
  userId?: string
}

export interface ScoreLeadResult {
  success: boolean
  score?: number
  tier?: 'high' | 'medium' | 'low'
  breakdown?: LeadScoreBreakdown
  provider?: string
  model?: string
  error?: string
  errorCode?: string
  latencyMs?: number
}

/**
 * Safely parses the AI model's completion text into a validated LeadScoreBreakdown.
 */
function parseLeadScoreResponse(content: string, fallbackScore: number = 50): LeadScoreBreakdown {
  const calculatedAt = new Date().toISOString()

  try {
    let cleanText = content.trim()
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    }

    const parsed = JSON.parse(cleanText)
    const rawScore = Number(parsed.score)
    const score = Number.isFinite(rawScore)
      ? Math.max(0, Math.min(100, Math.round(rawScore)))
      : fallbackScore

    let tier: 'high' | 'medium' | 'low' = 'medium'
    if (score >= 67) tier = 'high'
    else if (score <= 33) tier = 'low'

    const factors: LeadScoreFactor[] = Array.isArray(parsed.factors)
      ? parsed.factors.map((f: any) => ({
          factor: String(f.factor || 'Signal'),
          impact: (f.impact === 'positive' || f.impact === 'negative' || f.impact === 'neutral') ? f.impact : 'neutral',
          description: String(f.description || ''),
          weight: typeof f.weight === 'number' ? f.weight : undefined,
        }))
      : []

    return {
      score,
      tier,
      summary: String(parsed.summary || `Lead evaluated with score ${score}/100.`),
      factors,
      recommendedAction: String(parsed.recommendedAction || 'Review client status and follow up with proposal.'),
      calculatedAt,
    }
  } catch {
    let tier: 'high' | 'medium' | 'low' = 'medium'
    if (fallbackScore >= 67) tier = 'high'
    else if (fallbackScore <= 33) tier = 'low'

    return {
      score: fallbackScore,
      tier,
      summary: 'Evaluation generated from available CRM deal data.',
      factors: [
        { factor: 'Deal Value', impact: 'neutral', description: 'Assessed from current deal record' },
        { factor: 'Stage Velocity', impact: 'neutral', description: 'Pipeline tenure and stage activity' },
      ],
      recommendedAction: 'Schedule follow-up to advance discovery.',
      calculatedAt,
    }
  }
}

/**
 * Computes an objective 0-100 AI lead score for a CRM client deal.
 * Integrates 4 data sources:
 * 1. Deal value from client record
 * 2. Stage velocity (days in current stage vs total pipeline time)
 * 3. Client communication engagement from communication_messages
 * 4. Project history from projects table
 *
 * Persists the resulting lead_score, lead_score_updated_at, and lead_score_breakdown
 * to the clients table and records usage in ai_usage_log.
 */
export async function scoreLead(params: ScoreLeadParams): Promise<ScoreLeadResult> {
  const { clientId, organizationId, userId } = params
  const supabase = await createClient()

  // 1. Fetch Client Deal Record
  let clientRecord: any = null
  try {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('organization_id', organizationId)
      .maybeSingle()
    clientRecord = data
  } catch (err) {}

  if (!clientRecord && process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS) {
    clientRecord = (global as any).__DEV_CLIENTS.find((c: any) => c.id === clientId)
  }

  if (!clientRecord) {
    return {
      success: false,
      error: `Client with ID ${clientId} not found.`,
      errorCode: 'CLIENT_NOT_FOUND',
    }
  }

  // 2. Fetch Client Engagement from Communication Hub Messages
  let totalMessages = 0
  let inboundMessages = 0
  let outboundMessages = 0
  let lastContactDaysAgo: number | null = null
  const recentInteractions: Array<{ date: string; channel: string; summary: string }> = []

  try {
    const { data: messages } = await supabase
      .from('communication_messages')
      .select('direction, sent_at, body, channel:communication_channels(provider)')
      .eq('client_id', clientId)
      .eq('organization_id', organizationId)
      .order('sent_at', { ascending: false })
      .limit(10)

    if (messages && messages.length > 0) {
      totalMessages = messages.length
      inboundMessages = messages.filter((m: any) => m.direction === 'inbound').length
      outboundMessages = messages.filter((m: any) => m.direction === 'outbound').length

      const latestSent = new Date(messages[0].sent_at)
      lastContactDaysAgo = Math.max(0, Math.floor((Date.now() - latestSent.getTime()) / (1000 * 60 * 60 * 24)))

      messages.slice(0, 3).forEach((m: any) => {
        const prov = (m.channel && m.channel.provider) || 'email'
        recentInteractions.push({
          date: new Date(m.sent_at).toLocaleDateString(),
          channel: prov,
          summary: m.body.slice(0, 90),
        })
      })
    }
  } catch (e) {}

  // 3. Fetch Project History for this Client
  let totalProjects = 0
  let completedProjects = 0
  let activeProjects = 0
  let overdueProjects = 0

  try {
    const { data: projects } = await supabase
      .from('projects')
      .select('status, deadline')
      .eq('client_id', clientId)
      .eq('organization_id', organizationId)

    if (projects) {
      totalProjects = projects.length
      const now = new Date()
      projects.forEach((p: any) => {
        if (p.status === 'completed') {
          completedProjects++
        } else if (p.status === 'active' || p.status === 'in_progress') {
          activeProjects++
          if (p.deadline && new Date(p.deadline) < now) {
            overdueProjects++
          }
        }
      })
    }
  } catch (e) {}

  // 4. Calculate Stage Progression Velocity
  const nowMs = Date.now()
  const stageUpdatedMs = clientRecord.stage_updated_at ? new Date(clientRecord.stage_updated_at).getTime() : nowMs
  const createdMs = clientRecord.created_at ? new Date(clientRecord.created_at).getTime() : nowMs

  const daysInCurrentStage = Math.max(0, Math.floor((nowMs - stageUpdatedMs) / (1000 * 60 * 60 * 24)))
  const totalDaysInPipeline = Math.max(0, Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24)))

  const dealValue = parseFloat(clientRecord.deal_value || '0')

  // 5. Construct AI Prompt
  const promptInput: LeadScoringInput = {
    leadName: clientRecord.name,
    company: clientRecord.company,
    dealValue: dealValue > 0 ? dealValue : null,
    source: clientRecord.platform || 'Direct Outreach',
    currentStage: clientRecord.pipeline_stage || 'new',
    daysInCurrentStage,
    totalDaysInPipeline,
    notes: clientRecord.notes,
    engagementMetrics: {
      totalMessages,
      inboundMessages,
      outboundMessages,
      lastContactDaysAgo,
    },
    projectHistory: {
      totalProjects,
      completedProjects,
      activeProjects,
      overdueProjects,
    },
    recentInteractions,
  }

  const messages = buildLeadScoringPrompt(promptInput)

  // 6. Invoke AI Provider via Dual-Gated Client
  const completion = await generateAICompletion({
    organizationId,
    userId,
    feature: 'lead_scoring',
    messages,
    responseFormat: 'json',
    temperature: 0.3,
    maxTokens: 500,
    metadata: {
      clientId,
      dealValue,
      daysInCurrentStage,
      totalMessages,
      completedProjects,
      overdueProjects,
    },
  })

  if (!completion.success) {
    return {
      success: false,
      error: completion.error || 'Failed to compute AI lead score.',
      errorCode: completion.errorCode,
      provider: completion.provider,
      model: completion.model,
      latencyMs: completion.latencyMs,
    }
  }

  // 7. Parse Structured Breakdown
  const breakdown = parseLeadScoreResponse(completion.content)

  // 8. Persist Score & Breakdown to Database
  try {
    await supabase
      .from('clients')
      .update({
        lead_score: breakdown.score,
        lead_score_updated_at: breakdown.calculatedAt,
        lead_score_breakdown: breakdown,
      })
      .eq('id', clientId)
      .eq('organization_id', organizationId)
  } catch (dbErr) {
    console.warn('[AI:LeadScoring] Failed to persist score to database:', dbErr)
  }

  // Dev fallback cache
  if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS) {
    const idx = (global as any).__DEV_CLIENTS.findIndex((c: any) => c.id === clientId)
    if (idx !== -1) {
      ;(global as any).__DEV_CLIENTS[idx] = {
        ...(global as any).__DEV_CLIENTS[idx],
        lead_score: breakdown.score,
        lead_score_updated_at: breakdown.calculatedAt,
        lead_score_breakdown: breakdown,
      }
    }
  }

  return {
    success: true,
    score: breakdown.score,
    tier: breakdown.tier,
    breakdown,
    provider: completion.provider,
    model: completion.model,
    latencyMs: completion.latencyMs,
  }
}
