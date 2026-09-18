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
      // Extract client message from user prompt
      const messageBodyMatch = userMessage.match(/"""\s*([\s\S]*?)\s*"""/)
      const clientText = (messageBodyMatch ? messageBodyMatch[1] : userMessage).toLowerCase()
      const tasks: any[] = []

      // Helper to compute upcoming date
      const getFutureDate = (daysAhead: number) => {
        const d = new Date()
        d.setDate(d.getDate() + daysAhead)
        return d.toISOString().split('T')[0]
      }

      const hasActionRequest =
        clientText.includes('please') ||
        clientText.includes('can you') ||
        clientText.includes('could you') ||
        clientText.includes('need to') ||
        clientText.includes('need you') ||
        clientText.includes('send me') ||
        clientText.includes('fix the') ||
        clientText.includes('update the') ||
        clientText.includes('deploy to')

      const isConversationalOnly =
        !hasActionRequest &&
        (clientText.includes('thanks') ||
         clientText.includes('thank you') ||
         clientText.includes('sounds good') ||
         clientText.includes('great work') ||
         clientText.includes('look great') ||
         clientText.includes('looks great') ||
         clientText.includes('perfect') ||
         clientText.includes('noted'))

      if (!isConversationalOnly) {
        const hasInvoice = clientText.includes('invoice') || clientText.includes('billing') || clientText.includes('payment')
        const hasDeploy = clientText.includes('deploy') || clientText.includes('staging') || clientText.includes('release')
        const hasDesignAction =
          clientText.includes('wireframe') ||
          clientText.includes('figma') ||
          clientText.includes('redesign') ||
          clientText.includes('logo') ||
          clientText.includes('cta') ||
          clientText.includes('banner') ||
          (clientText.includes('design') && (clientText.includes('update') || clientText.includes('change') || clientText.includes('revise') || clientText.includes('create')))
        const hasFix = clientText.includes('bug') || clientText.includes('fix') || clientText.includes('issue') || clientText.includes('error') || clientText.includes('broken')

        if (hasInvoice) {
          const dueFriday = clientText.includes('friday') ? getFutureDate(4) : getFutureDate(3)
          tasks.push({
            title: 'Prepare and send milestone invoice',
            description: 'Client requested updated invoice documentation for deliverables review.',
            priority: 'high',
            suggestedDueDate: dueFriday,
            suggestedAssignee: 'Billing / Finance',
            confidenceScore: 96,
            sourceSnippet: clientText.includes('invoice') ? 'send me the invoice by Friday' : 'send over the invoice',
            estimatedHours: 1,
          })
        }

        if (hasDesignAction) {
          tasks.push({
            title: 'Update UI design assets and wireframe mockups',
            description: 'Refine visual styling and client interface deliverables per latest feedback.',
            priority: 'medium',
            suggestedDueDate: getFutureDate(3),
            suggestedAssignee: 'UI/UX Designer',
            confidenceScore: 91,
            sourceSnippet: 'review the latest homepage mockup design draft',
            estimatedHours: 2,
          })
        }

        if (hasDeploy) {
          tasks.push({
            title: 'Deploy responsive build to staging environment',
            description: 'Deploy latest application build to preview server for cross-browser testing.',
            priority: 'high',
            suggestedDueDate: getFutureDate(1),
            suggestedAssignee: 'Frontend Engineer',
            confidenceScore: 94,
            sourceSnippet: 'deploy to preview environment',
            estimatedHours: 3,
          })
        }

        if (hasFix) {
          tasks.push({
            title: 'Investigate and resolve reported client issue',
            description: 'Inspect logs and fix reported defect before scheduled release.',
            priority: 'urgent',
            suggestedDueDate: getFutureDate(1),
            suggestedAssignee: 'QA Engineer',
            confidenceScore: 95,
            sourceSnippet: 'reported issue in production',
            estimatedHours: 2,
          })
        }

        // Generic fallback if user asked for something actionable
        if (tasks.length === 0 && hasActionRequest) {
          tasks.push({
            title: 'Follow up on client inquiry and deliverables',
            description: 'Client requested action item in latest communication thread.',
            priority: 'medium',
            suggestedDueDate: getFutureDate(3),
            suggestedAssignee: 'Account Manager',
            confidenceScore: 86,
            sourceSnippet: 'Please take a look at the requirements',
            estimatedHours: 2,
          })
        }
      }

      content = JSON.stringify({ tasks }, null, 2)
      break
    }

    case 'weekly_narrative': {
      const meta = request.metadata || {}
      const completedTasks = Number(meta.completedTasksCount ?? (userMessage.match(/Completed Tasks:\s*(\d+)/i)?.[1] ?? 14))
      const activeProjects = Number(meta.activeProjectsCount ?? (userMessage.match(/Active Projects:\s*(\d+)/i)?.[1] ?? 5))
      const newClients = Number(meta.newClientsCount ?? (userMessage.match(/New Clients Acquired:\s*(\d+)/i)?.[1] ?? 3))
      const revenue = Number(meta.revenueGenerated ?? (userMessage.match(/Revenue \/ Invoiced Amount:[^\d]*([\d,]+)/i)?.[1]?.replace(/,/g, '') ?? 28500))
      const commVolume = Number(meta.communicationVolume ?? (userMessage.match(/Client Messages & Interactions:\s*(\d+)/i)?.[1] ?? 42))
      const overdueItems = Number(meta.overdueItemsCount ?? (userMessage.match(/Overdue Items \/ Flags:\s*(\d+)/i)?.[1] ?? 1))
      const dateRange = meta.weekDateRange || (userMessage.match(/Week:\s*([^\n]+)/i)?.[1]?.trim() ?? 'Past 7 Days')
      const orgName = meta.organizationName || (userMessage.match(/Agency:\s*([^\n]+)/i)?.[1]?.trim() ?? 'Agency Workspace')

      content = `# Executive Summary — Weekly Progress Report (${dateRange})

### 1. Key Milestones & Operational Accomplishments
The team at **${orgName}** maintained high delivery velocity throughout this reporting window, successfully closing out **${completedTasks} completed tasks** across client initiatives. On the growth front, the agency welcomed **${newClients} new clients**, expanding our client portfolio and reinforcing momentum in key accounts.

### 2. Active Project Health & Revenue Summary
Operations are currently driving **${activeProjects} active projects** through active delivery milestones. Revenue invoiced and recognized across contracts totaled **$${revenue.toLocaleString()}**, reflecting solid commercial progress against deliverables and milestones.

### 3. Client Communications & Engagement
Client communication channels logged a cumulative volume of **${commVolume} messages and interactions** across integrated platforms. High responsiveness and structured thread coordination contributed to prompt resolution and seamless stakeholder alignment.

### 4. Risks, Overdue Items & Upcoming Priorities
Operational risk remains controlled, though **${overdueItems} overdue item(s)** require focused team attention to clear delivery blockers. For the upcoming week, primary priorities center on closing out pending sprints, advancing active project milestones, and maintaining proactive client communications.`
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
