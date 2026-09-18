import { generateAICompletion } from '../client'
import {
  buildWeeklyNarrativePrompt,
  WeeklyNarrativeInput,
} from '../prompts/weekly-narrative'
import { AIProviderType } from '../types'

export interface WeeklyReportFigures {
  organizationName: string
  weekDateRange: string
  completedTasksCount: number
  activeProjectsCount: number
  newClientsCount: number
  revenueGenerated: number
  currency?: string
  communicationVolume: number
  overdueItemsCount: number
  completedDeliverables?: Array<{
    title: string
    projectName: string
    completedDate?: string
  }>
  inProgressProjects?: Array<{
    name: string
    status: string
    progressPercent?: number
    budgetUsed?: number
    totalBudget?: number
  }>
  openBlockers?: string[]
}

export interface GenerateWeeklyNarrativeParams {
  organizationId: string
  userId?: string | null
  figures: WeeklyReportFigures
}

export interface GenerateWeeklyNarrativeResult {
  success: boolean
  narrative: string
  error?: string
  errorCode?: string
  provider?: AIProviderType
  model?: string
  latencyMs?: number
}

/**
 * Pure feature orchestrator for generating executive weekly report narratives.
 * Takes aggregate performance figures in, returns an authoritative, non-fabricated narrative text out.
 * Gated by platform kill switch + subscription plan limits and logged in public.ai_usage_log.
 *
 * Pluggable for:
 * - Interactive UI Report modal & page (Task 47)
 * - Automated n8n / cron weekly summary job & Slack dispatcher (Task 52)
 * - Executive analytics reports (Task 58)
 */
export async function generateWeeklyReportNarrative(
  params: GenerateWeeklyNarrativeParams
): Promise<GenerateWeeklyNarrativeResult> {
  const { organizationId, userId, figures } = params

  const promptInput: WeeklyNarrativeInput = {
    organizationName: figures.organizationName,
    weekDateRange: figures.weekDateRange,
    completedTasksCount: figures.completedTasksCount,
    activeProjectsCount: figures.activeProjectsCount,
    newClientsCount: figures.newClientsCount,
    revenueGenerated: figures.revenueGenerated,
    currency: figures.currency || 'USD',
    communicationVolume: figures.communicationVolume,
    overdueItemsCount: figures.overdueItemsCount,
    completedDeliverables: figures.completedDeliverables,
    inProgressProjects: figures.inProgressProjects,
    openBlockers: figures.openBlockers,
  }

  const messages = buildWeeklyNarrativePrompt(promptInput)

  const completion = await generateAICompletion({
    organizationId,
    userId,
    feature: 'weekly_narrative',
    messages,
    responseFormat: 'text',
    temperature: 0.3,
    maxTokens: 1200,
    metadata: {
      organizationName: figures.organizationName,
      weekDateRange: figures.weekDateRange,
      completedTasksCount: figures.completedTasksCount,
      activeProjectsCount: figures.activeProjectsCount,
      newClientsCount: figures.newClientsCount,
      revenueGenerated: figures.revenueGenerated,
      currency: figures.currency || 'USD',
      communicationVolume: figures.communicationVolume,
      overdueItemsCount: figures.overdueItemsCount,
    },
  })

  if (!completion.success) {
    return {
      success: false,
      narrative: '',
      error: completion.error || 'Failed to generate weekly narrative.',
      errorCode: completion.errorCode,
      provider: completion.provider,
      model: completion.model,
      latencyMs: completion.latencyMs,
    }
  }

  return {
    success: true,
    narrative: completion.content.trim(),
    provider: completion.provider,
    model: completion.model,
    latencyMs: completion.latencyMs,
  }
}
