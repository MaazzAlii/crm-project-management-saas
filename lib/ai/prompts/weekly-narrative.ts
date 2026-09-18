import { AIChatMessage } from '../types'

export interface WeeklyNarrativeInput {
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
  resolvedTicketsCount?: number
  openBlockers?: string[]
}

/**
 * Builds system and user prompt for Task 47 — Weekly Report Narrative Generation.
 * Synthesizes CRM, project, communication, and revenue data into an executive report.
 * Strictly enforces non-fabrication of numeric metrics.
 */
export function buildWeeklyNarrativePrompt(input: WeeklyNarrativeInput): AIChatMessage[] {
  const currency = input.currency || 'USD'
  const formattedRevenue = `${currency} $${input.revenueGenerated.toLocaleString()}`

  const systemPrompt = `You are a chief operations officer and principal project director at ${input.organizationName}.
Your objective is to generate a comprehensive, executive-level Weekly Progress Narrative Report.

CRITICAL INTEGRITY CONSTRAINTS:
1. Anti-Fabrication Rule: Strictly summarize ONLY the concrete figures supplied in the input data. Never invent, alter, or extrapolate numbers, dates, or revenue not explicitly provided.
2. Mention the exact metrics supplied:
   - ${input.completedTasksCount} completed tasks
   - ${input.activeProjectsCount} active projects
   - ${input.newClientsCount} new clients acquired
   - ${formattedRevenue} in revenue/invoiced amount
   - ${input.communicationVolume} client communication messages handled
   - ${input.overdueItemsCount} overdue items or timeline flags
3. Structure:
   # Executive Summary — Weekly Progress Report (${input.weekDateRange})
   ## 1. Key Milestones & Operational Accomplishments
   ## 2. Active Project Health & Revenue Summary
   ## 3. Client Communications & Engagement
   ## 4. Risks, Overdue Items & Next Week Priorities
4. Tone: Polished, professional, authoritative, transparent, and confidence-inspiring for stakeholders and executive leadership. Format output in clean Markdown.`

  const deliverablesText = (input.completedDeliverables && input.completedDeliverables.length > 0)
    ? input.completedDeliverables.map((d) => `- [${d.projectName}] ${d.title}${d.completedDate ? ` (Completed on ${d.completedDate})` : ''}`).join('\n')
    : '- Core deliverables on schedule.'

  const projectsText = (input.inProgressProjects && input.inProgressProjects.length > 0)
    ? input.inProgressProjects.map((p) => `- **${p.name}** (${p.status})${p.progressPercent ? `: ${p.progressPercent}% complete` : ''}`).join('\n')
    : `- ${input.activeProjectsCount} active client projects in progress.`

  const blockersText = (input.openBlockers && input.openBlockers.length > 0)
    ? input.openBlockers.map((b) => `- ⚠️ ${b}`).join('\n')
    : input.overdueItemsCount > 0
    ? `- ⚠️ ${input.overdueItemsCount} task(s) currently marked overdue requiring prioritization.`
    : '- All scheduled milestones progressing within expected delivery thresholds.'

  const userPrompt = `Agency: ${input.organizationName}
Week: ${input.weekDateRange}

Key Performance Metrics:
- Completed Tasks: ${input.completedTasksCount}
- Active Projects: ${input.activeProjectsCount}
- New Clients Acquired: ${input.newClientsCount}
- Revenue / Invoiced Amount: ${formattedRevenue}
- Client Messages & Interactions: ${input.communicationVolume}
- Overdue Items / Flags: ${input.overdueItemsCount}

Completed Deliverables:
${deliverablesText}

Project Health:
${projectsText}

Risks & Overdue Flags:
${blockersText}

Synthesize these verified metrics into an executive weekly progress narrative report in Markdown:`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}
