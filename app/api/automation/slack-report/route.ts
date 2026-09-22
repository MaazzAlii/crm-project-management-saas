import { NextRequest, NextResponse } from 'next/server'
import {
  dispatchSystemReport,
  sendSlackWebhook,
  buildSlackSystemTestBlocks,
  E2ESystemReport,
} from '@/lib/notifications/slack-reporter'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const webhookUrl = body.webhook_url || process.env.SLACK_WEBHOOK_URL

    if (body.test_ping) {
      if (!webhookUrl) {
        return NextResponse.json(
          { error: 'SLACK_WEBHOOK_URL not configured. Please supply webhook_url in request or set SLACK_WEBHOOK_URL in environment.' },
          { status: 400 }
        )
      }
      const testPayload = {
        text: '🔔 Innoventix SaaS: Slack Integration Test Ping',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🔔 Innoventix SaaS Webhook Connected',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Success!* Your Slack integration is active and able to receive automated system reports, weekly digests, and task alerts.\n*Time:* \`${new Date().toISOString()}\``,
            },
          },
        ],
      }
      const pingResult = await sendSlackWebhook(webhookUrl, testPayload)
      return NextResponse.json({ success: pingResult.success, result: pingResult })
    }

    const report: E2ESystemReport = body.report || {
      title: 'Manual System Health Report',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      totalDurationMs: 1200,
      totalTests: 1,
      passed: 1,
      failed: 0,
      subMenusTested: [
        {
          id: 'manual-trigger',
          name: 'Manual Health Check',
          path: '/api/automation/slack-report',
          status: 'passed',
          actionPerformed: 'Triggered Slack Report API',
          durationMs: 25,
        },
      ],
      dataCreated: { clients: 0, leads: 0, projects: 0, tasks: 0, messages: 0 },
      screenshotsCatalog: [],
    }

    const dispatchResult = await dispatchSystemReport(report, webhookUrl)

    return NextResponse.json({
      success: true,
      dispatchResult,
      payloadPreview: buildSlackSystemTestBlocks(report),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to dispatch Slack report' }, { status: 500 })
  }
}

export async function GET() {
  const isConfigured = !!process.env.SLACK_WEBHOOK_URL
  return NextResponse.json({
    slack_configured: isConfigured,
    target: isConfigured ? 'configured' : 'none (will log to console and report file)',
  })
}
