import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAutomationSignature } from '@/lib/automation/emitter'
import { readValidatedBody } from '@/lib/security/payload'

export const dynamic = 'force-dynamic'

/**
 * Health check / verification endpoint for automation events
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'automation-events-receiver',
    timestamp: new Date().toISOString(),
    supported_events: [
      'project.delivered',
      'task.deadline_approaching',
      'project.overdue',
      'weekly.summary_ready',
      'ping',
    ],
  })
}

/**
 * Inbound automation webhook handler / test receiver
 * Validates HMAC-SHA256 signature against organization secret or system secret.
 */
export async function POST(req: NextRequest) {
  try {
    const { body: rawBody, error: bodyError, status: bodyStatus } = await readValidatedBody(req)
    if (bodyError || !rawBody) {
      return NextResponse.json({ error: bodyError || 'Empty request body' }, { status: bodyStatus || 400 })
    }

    const signature = req.headers.get('x-automation-signature') || ''
    const eventType = req.headers.get('x-automation-event')
    const deliveryId = req.headers.get('x-automation-delivery')

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 })
    }

    const orgId = payload.organization_id
    let secret = process.env.N8N_WEBHOOK_SECRET || process.env.AUTOMATION_WEBHOOK_SECRET || ''

    if (orgId) {
      try {
        const supabase = await createClient()
        const { data: org } = await supabase
          .from('organizations')
          .select('automation_webhook_secret')
          .eq('id', orgId)
          .maybeSingle()

        if (org?.automation_webhook_secret) {
          secret = org.automation_webhook_secret
        }
      } catch (err) {
        console.warn('[Automation:API] Failed to fetch organization secret:', err)
      }
    }

    // If a secret is configured either for org or globally, enforce signature validation
    if (secret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing X-Automation-Signature header' }, { status: 401 })
      }

      const isValid = verifyAutomationSignature(rawBody, signature, secret)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 })
      }
    }

    console.log('[Automation:API] Webhook event received & verified:', {
      event: eventType || payload.event,
      deliveryId: deliveryId || payload.id,
      organizationId: orgId,
      timestamp: payload.timestamp,
    })

    return NextResponse.json({
      status: 'received',
      delivery_id: deliveryId || payload.id,
      event: eventType || payload.event,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[Automation:API] Error processing incoming event:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
