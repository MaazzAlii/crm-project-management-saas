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
      content = JSON.stringify({
        score: 84,
        tier: 'hot',
        summary: 'High-intent lead with defined budget, active timeline, and direct executive sponsorship.',
        factors: [
          { factor: 'Budget Defined', impact: 'positive', description: 'Explicit budget range provided ($15k - $25k)' },
          { factor: 'Urgency', impact: 'positive', description: 'Target start date within 14 days' },
          { factor: 'Decision Maker', impact: 'positive', description: 'Contact is VP of Operations' },
        ],
        recommendedAction: 'Schedule technical discovery call within 24 hours and attach enterprise deck.',
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
