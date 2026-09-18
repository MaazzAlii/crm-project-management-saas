import { AICompletionRequest, AICompletionResponse } from '../types'

/**
 * Deterministic Mock AI provider for local development, CI, and test environments.
 * Generates rich, contextual responses matching specific feature contracts without
 * requiring commercial API keys or network latency.
 */
export async function executeMockCompletion(
  request: AICompletionRequest
): Promise<AICompletionResponse> {
  const startTime = Date.now()
  const userMessage = [...request.messages].reverse().find((m) => m.role === 'user')?.content || ''

  let content = ''

  switch (request.feature) {
    case 'reply_suggestions': {
      const channel = (request.metadata?.channel || '').toLowerCase()
      const isManual = request.metadata?.communicationMode === 'manual'

      let suggestions = [
        {
          tone: 'Professional',
          text: 'Thank you for reaching out. We have reviewed your request and are preparing the required deliverables for your review by tomorrow morning.',
        },
        {
          tone: 'Collaborative',
          text: 'Great update! Let’s hop on a brief 10-minute sync to finalize the details and align on the next milestone.',
        },
        {
          tone: 'Direct',
          text: 'Received and confirmed. We are on track with the agreed roadmap.',
        },
      ]

      if (channel === 'whatsapp') {
        suggestions = [
          {
            tone: 'Professional',
            text: 'Hi there! We’ve reviewed your message and are finalizing your updates for review tomorrow morning.',
          },
          {
            tone: 'Collaborative',
            text: 'Sounds great! Can we do a quick 5-min WhatsApp call or sync to lock in next steps?',
          },
          {
            tone: 'Direct',
            text: 'Got it! Working on this now and will update you shortly.',
          },
        ]
      } else if (isManual) {
        suggestions = [
          {
            tone: 'Professional',
            text: 'Thank you for reaching out. Our team has logged your notes and we will follow up with the detailed proposal shortly.',
          },
          {
            tone: 'Collaborative',
            text: 'Appreciate the feedback! We are syncing internally and will reach out with the next milestone overview.',
          },
          {
            tone: 'Direct',
            text: 'Acknowledged. Message logged and our account manager is following up today.',
          },
        ]
      }

      if (request.responseFormat === 'json') {
        content = JSON.stringify({ suggestions }, null, 2)
      } else {
        content = suggestions.map((s, idx) => `${idx + 1}. ${s.tone}: ${s.text}`).join('\n')
      }
      break
    }

    case 'lead_scoring': {
      const dealValue = Number(request.metadata?.dealValue ?? 5000)
      const messagesCount = Number(request.metadata?.totalMessages ?? 1)
      const daysInStage = Number(request.metadata?.daysInCurrentStage ?? 3)
      const completedProjects = Number(request.metadata?.completedProjects ?? 0)
      const overdueProjects = Number(request.metadata?.overdueProjects ?? 0)

      // Dynamic baseline scoring based on real dimensions
      let calculatedScore = 50

      // 1. Deal Value (Higher value = higher score multiplier)
      if (dealValue >= 25000) calculatedScore += 16
      else if (dealValue >= 10000) calculatedScore += 8
      else if (dealValue >= 3000) calculatedScore += 2
      else if (dealValue > 0) calculatedScore -= 6
      else calculatedScore -= 14

      // 2. Stage Progression Speed (Rapid progression = momentum)
      if (daysInStage <= 3) calculatedScore += 12
      else if (daysInStage <= 10) calculatedScore += 5
      else if (daysInStage <= 20) calculatedScore += 0
      else if (daysInStage <= 35) calculatedScore -= 10
      else calculatedScore -= 18

      // 3. Client Engagement (Message frequency and recency)
      if (messagesCount >= 8) calculatedScore += 12
      else if (messagesCount >= 3) calculatedScore += 5
      else if (messagesCount >= 1) calculatedScore -= 2
      else calculatedScore -= 12

      // 4. Project History (Completed vs overdue)
      if (completedProjects >= 2) calculatedScore += 10
      else if (completedProjects === 1) calculatedScore += 5
      if (overdueProjects > 0) calculatedScore -= 15

      calculatedScore = Math.max(8, Math.min(96, Math.round(calculatedScore)))

      let tier: 'high' | 'medium' | 'low' = 'medium'
      if (calculatedScore >= 67) tier = 'high'
      else if (calculatedScore <= 33) tier = 'low'

      const factors = [
        {
          factor: 'Deal Value',
          impact: dealValue >= 10000 ? 'positive' : dealValue >= 5000 ? 'neutral' : 'negative',
          description: dealValue > 0 ? `Estimated contract value of $${dealValue.toLocaleString()}` : 'No deal value stated yet',
        },
        {
          factor: 'Stage Progression Speed',
          impact: daysInStage <= 7 ? 'positive' : daysInStage <= 20 ? 'neutral' : 'negative',
          description: `${daysInStage} days in current pipeline stage`,
        },
        {
          factor: 'Client Engagement',
          impact: messagesCount >= 3 ? 'positive' : messagesCount >= 1 ? 'neutral' : 'negative',
          description: `${messagesCount} recorded messages and interactions`,
        },
        {
          factor: 'Project History',
          impact: completedProjects > 0 ? 'positive' : overdueProjects > 0 ? 'negative' : 'neutral',
          description: completedProjects > 0 ? `${completedProjects} successfully completed projects` : 'No delivery disputes on record',
        },
      ]

      const summary = tier === 'high'
        ? `High-quality prospect with strong deal value ($${dealValue.toLocaleString()}), rapid progression, and solid engagement.`
        : tier === 'medium'
        ? `Moderate potential lead. Maintain active outreach to confirm budget alignment and accelerate stage progression.`
        : `Low quality lead. Interaction is minimal or deal value is unconfirmed. Recommend preliminary qualification check.`

      const recommendedAction = tier === 'high'
        ? 'Schedule executive discovery call within 24 hours to finalize proposal and lock in target start date.'
        : tier === 'medium'
        ? 'Send follow-up case study and request 15-minute alignment call regarding scope deliverables.'
        : 'Send automated qualification questionnaire before allocating dedicated technical sales resources.'

      content = JSON.stringify({
        score: calculatedScore,
        tier,
        summary,
        factors,
        recommendedAction,
      }, null, 2)
      break
    }

    case 'task_extraction': {
      content = JSON.stringify({
        tasks: [
          {
            title: 'Prepare staging deployment for responsive navigation bar',
            description: 'Deploy the latest responsive navigation build to the client preview environment.',
            priority: 'high',
            estimatedHours: 3,
            suggestedAssignee: 'Frontend Team',
          },
          {
            title: 'Send updated wireframe assets to client for sign-off',
            description: 'Export Figma high-fidelity prototypes and share access link.',
            priority: 'medium',
            estimatedHours: 1,
            suggestedAssignee: 'UI/UX Designer',
          },
        ],
      }, null, 2)
      break
    }

    case 'weekly_narrative': {
      content = `### Executive Summary — Weekly Progress Report

#### Key Achievements
- Completed Sprint 4 deliverables ahead of schedule, including the unified inbox real-time notifications.
- Resolved all outstanding high-priority tickets across the project kanban board.
- Conducted client milestone walkthrough with full stakeholder approval.

#### Active Focus & Upcoming Milestones
- Initiating end-to-end load testing and cross-browser quality assurance.
- Finalizing production deployment cutover checklist on Contabo VPS.

#### Operational Health
- Budget Utilization: 68% (on track)
- Velocity: 42 story points completed
- Risk Level: Low — no blockers identified.`
      break
    }

    case 'test_prompt':
    default: {
      content = `[Mock AI Provider] Response to: "${userMessage.slice(0, 80)}...". Gating validated, execution completed cleanly.`
      break
    }
  }

  const promptText = request.messages.map((m) => m.content).join(' ')
  const promptTokens = Math.max(1, Math.round(promptText.length / 4))
  const completionTokens = Math.max(1, Math.round(content.length / 4))
  const totalTokens = promptTokens + completionTokens

  return {
    success: true,
    content,
    provider: 'mock',
    model: 'mock-agent-v1',
    usage: {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost: 0,
    },
    latencyMs: Date.now() - startTime,
  }
}
