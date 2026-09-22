/**
 * Slack Notification & Reporting Service
 * Formats and dispatches automated system test results, sub-menu test audits,
 * and weekly performance digests to Slack via incoming webhooks.
 */

export interface SubMenuTestItem {
  id: string
  name: string
  path: string
  status: 'passed' | 'failed' | 'skipped'
  actionPerformed: string
  screenshotName?: string
  durationMs: number
}

export interface E2ESystemReport {
  title: string
  timestamp: string
  environment: string
  baseUrl: string
  totalDurationMs: number
  totalTests: number
  passed: number
  failed: number
  subMenusTested: SubMenuTestItem[]
  dataCreated: {
    clients: number
    leads: number
    projects: number
    tasks: number
    messages: number
  }
  weeklySummary?: {
    period: string
    activeProjects: number
    completedTasks: number
    newClients: number
    revenue: number
    commVolume: number
    narrativeSummary?: string
  }
  screenshotsCatalog: Array<{
    filename: string
    title: string
    route: string
  }>
}

export interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
    emoji?: boolean
  }
  fields?: Array<{
    type: string
    text: string
  }>
  elements?: Array<{
    type: string
    text: string
  }>
}

export interface SlackMessagePayload {
  text: string
  blocks: SlackBlock[]
}

/**
 * Builds a Slack Block Kit payload from an E2E test report.
 */
export function buildSlackSystemTestBlocks(report: E2ESystemReport): SlackMessagePayload {
  const isAllPassed = report.failed === 0
  const statusEmoji = isAllPassed ? '✅' : '⚠️'
  const durationSec = (report.totalDurationMs / 1000).toFixed(1)

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🚀 Innoventix SaaS: E2E Full System Test Report`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Status:* ${statusEmoji} *${isAllPassed ? 'All Tests Passed (100%)' : `${report.failed} Failed`}*\n*Timestamp:* \`${report.timestamp}\` | *Duration:* \`${durationSec}s\` | *Environment:* \`${report.environment}\``,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Total Sub-Menus Tested:*\n${report.subMenusTested.length} views verified`,
        },
        {
          type: 'mrkdwn',
          text: `*Data Injected:*\n${report.dataCreated.clients} clients, ${report.dataCreated.leads} leads, ${report.dataCreated.projects} projects, ${report.dataCreated.tasks} tasks`,
        },
      ],
    },
  ]

  // Add Weekly Report summary if present
  if (report.weeklySummary) {
    const ws = report.weeklySummary
    blocks.push(
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📊 *Weekly Performance Digest & Automation Test:*\n• *Active Projects:* ${ws.activeProjects}\n• *Completed Tasks:* ${ws.completedTasks}\n• *New Clients:* ${ws.newClients}\n• *Revenue Processed:* $${ws.revenue.toLocaleString()}\n• *Messages Handled:* ${ws.commVolume}`,
        },
      }
    )

    if (ws.narrativeSummary) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🤖 *AI Executive Narrative:*\n>${ws.narrativeSummary.replace(/\n/g, '\n>')}`,
        },
      })
    }
  }

  // Key Sub-menus verification sample
  const sampleItems = report.subMenusTested.slice(0, 10)
  const itemsText = sampleItems
    .map((item) => `• \`${item.status === 'passed' ? 'PASS' : 'FAIL'}\` *${item.name}* (\`${item.path}\`) — _${item.actionPerformed}_`)
    .join('\n')

  blocks.push(
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Verified Sub-Menus & Actions (sample ${sampleItems.length} of ${report.subMenusTested.length}):*\n${itemsText}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📸 *${report.screenshotsCatalog.length} Retina Screenshots Captured* | Stored in \`public/screenshots/e2e/\``,
        },
      ],
    }
  )

  return {
    text: `Innoventix SaaS E2E Test Report: ${report.passed}/${report.totalTests} Passed (${durationSec}s)`,
    blocks,
  }
}

/**
 * Dispatches the formatted Slack payload to an incoming webhook.
 */
export async function sendSlackWebhook(
  webhookUrl: string,
  payload: SlackMessagePayload
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errorText = await res.text()
      return { success: false, status: res.status, error: errorText }
    }

    return { success: true, status: res.status }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error sending Slack webhook' }
  }
}

/**
 * Main dispatcher: Sends to process.env.SLACK_WEBHOOK_URL or records fallback.
 */
export async function dispatchSystemReport(
  report: E2ESystemReport,
  explicitWebhookUrl?: string
): Promise<{ dispatched: boolean; target: string; error?: string }> {
  const webhookUrl = explicitWebhookUrl || process.env.SLACK_WEBHOOK_URL

  const payload = buildSlackSystemTestBlocks(report)

  if (!webhookUrl) {
    console.log('[SlackReporter] No SLACK_WEBHOOK_URL configured. Payload prepared for Slack:')
    console.log(JSON.stringify(payload, null, 2))
    return {
      dispatched: false,
      target: 'console_and_artifact',
      error: 'SLACK_WEBHOOK_URL_NOT_CONFIGURED',
    }
  }

  const result = await sendSlackWebhook(webhookUrl, payload)
  return {
    dispatched: result.success,
    target: webhookUrl.replace(/\/[^/]+$/, '/***'), // mask endpoint secret
    error: result.error,
  }
}
