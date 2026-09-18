import { AIChatMessage } from '../types'

export interface WeeklyNarrativeInput {
  organizationName: string
  weekDateRange: string
  completedDeliverables: Array<{
    title: string
    projectName: string
    completedDate: string
  }>
  inProgressProjects: Array<{
    name: string
    status: string
    progressPercent: number
    budgetUsed: number
    totalBudget: number
  }>
  resolvedTicketsCount: number
  openBlockers?: string[]
}

/**
 * Builds system and user prompt for Task 47 — Weekly Report Narrative Generation.
 */
export function buildWeeklyNarrativePrompt(input: WeeklyNarrativeInput): AIChatMessage[] {
  const systemPrompt = `You are a chief operations officer and principal project director at ${input.organizationName}.
Your objective is to generate an executive-level Weekly Progress Narrative Report.

Structure Guidelines:
1. # Weekly Executive Summary (${input.weekDateRange})
2. ## Key Milestones & Completed Deliverables
3. ## Active Projects & Health Overview
4. ## Strategic Focus for Next Week
5. ## Blockers & Risk Mitigation (if any)

Tone: Authoritative, polished, transparent, and confidence-inspiring for stakeholders and executive sponsors. Output formatted Markdown.`

  const deliverablesText = input.completedDeliverables.length > 0
    ? input.completedDeliverables.map((d) => `- [${d.projectName}] ${d.title} (Completed on ${d.completedDate})`).join('\n')
    : '- No major deliverables finalized this week.'

  const projectsText = input.inProgressProjects.length > 0
    ? input.inProgressProjects.map((p) => `- **${p.name}** (${p.status}): ${p.progressPercent}% complete, $${p.budgetUsed.toLocaleString()} / $${p.totalBudget.toLocaleString()} budget spent`).join('\n')
    : '- No active projects.'

  const blockersText = input.openBlockers && input.openBlockers.length > 0
    ? input.openBlockers.map((b) => `- ⚠️ ${b}`).join('\n')
    : '- No critical blockers or timeline risks reported.'

  const userPrompt = `Agency: ${input.organizationName}
Week: ${input.weekDateRange}
Resolved Tasks / Tickets: ${input.resolvedTicketsCount}

Completed Deliverables:
${deliverablesText}

Project Status Summary:
${projectsText}

Identified Risks / Blockers:
${blockersText}

Synthesize this project data into an executive weekly progress narrative report in Markdown.`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}
