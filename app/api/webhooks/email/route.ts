import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptSecret } from '@/lib/security/encrypt'
import {
  parseEmailAddressHeader,
  normalizeEmailEventToIngestPayload,
} from '@/lib/providers/email'
import { ingestMessage } from '@/lib/inbox/ingest'
import { checkContentLength, DEFAULT_MAX_UPLOAD_PAYLOAD_BYTES } from '@/lib/security/payload'

export const dynamic = 'force-dynamic'

// GET status check for Email Inbound Webhook
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Email Inbound Parse Webhook Engine',
    timestamp: new Date().toISOString(),
  })
}

// POST endpoint for Inbound Parse Email Webhooks (SendGrid, Postmark, Mailgun, n8n)
export async function POST(req: NextRequest) {
  try {
    const lengthCheck = checkContentLength(req, DEFAULT_MAX_UPLOAD_PAYLOAD_BYTES)
    if (!lengthCheck.allowed) {
      return NextResponse.json({ error: lengthCheck.error }, { status: 413 })
    }

    const contentType = req.headers.get('content-type') || ''
    let bodyParams: Record<string, any> = {}

    if (contentType.includes('application/json')) {
      try {
        bodyParams = await req.json()
      } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      formData.forEach((value, key) => {
        bodyParams[key] = value.toString()
      })
    } else {
      const rawText = await req.text()
      const searchParams = new URLSearchParams(rawText)
      searchParams.forEach((value, key) => {
        bodyParams[key] = value
      })
    }

    const rawFrom = bodyParams.from || bodyParams.From || bodyParams.sender
    const recipientTo = bodyParams.to || bodyParams.To || bodyParams.recipient

    if (!rawFrom) {
      return NextResponse.json({ ok: true, message: 'Ignored payload without sender email address' })
    }

    const parsedSender = parseEmailAddressHeader(rawFrom)
    const parsedRecipient = parseEmailAddressHeader(recipientTo)

    // Resolve matching active Email communication channel from database
    const supabase = await createClient()

    const { data: channels, error: channelError } = await supabase
      .from('communication_channels')
      .select('id, organization_id, external_account_id, metadata, status')
      .eq('provider', 'email')
      .eq('status', 'active')

    if (channelError || !channels || channels.length === 0) {
      console.warn('[EmailWebhook] No active Email channel registered in platform.')
      return NextResponse.json({ ok: true, warning: 'No active Email channel found' })
    }

    // Match channel by external_account_id (email address/domain) or fallback
    const matchingChannel =
      channels.find((c) => {
        const meta = (c.metadata as Record<string, any>) || {}
        const channelEmail = c.external_account_id.toLowerCase()
        const targetEmail = parsedRecipient.email.toLowerCase()
        return (
          channelEmail === targetEmail ||
          meta.inbound_email === targetEmail ||
          targetEmail.endsWith(channelEmail)
        )
      }) || channels[0]

    const channelMeta = (matchingChannel.metadata as Record<string, any>) || {}

    // Verify inbound webhook secret if configured on channel or environment
    const authHeader = req.headers.get('authorization')
    const webhookSecretHeader = req.headers.get('x-webhook-secret')
    const querySecret = new URL(req.url).searchParams.get('secret')
    const providedSecret =
      webhookSecretHeader ||
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '') ||
      querySecret ||
      ''

    const encryptedWebhookSecret =
      channelMeta.webhook_secret || process.env.EMAIL_WEBHOOK_SECRET || ''
    const expectedSecret = decryptSecret(encryptedWebhookSecret)

    if (expectedSecret) {
      if (!providedSecret || providedSecret !== expectedSecret) {
        console.error('[EmailWebhook] Unauthorized email webhook payload secret validation failed.')
        return NextResponse.json({ error: 'Unauthorized: Invalid webhook secret' }, { status: 401 })
      }
    }

    // Normalize email event and Ingest into Communication Hub
    const normalizedPayload = normalizeEmailEventToIngestPayload(bodyParams)
    const ingestResult = await ingestMessage(matchingChannel.id, normalizedPayload)

    if (!ingestResult.success) {
      console.error('[EmailWebhook] Ingestion failed:', ingestResult.error)
      return NextResponse.json({ ok: false, error: ingestResult.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message_id: ingestResult.messageId,
      matched_client_id: ingestResult.clientId,
      sender_email: parsedSender.email,
    })
  } catch (err: any) {
    console.error('[EmailWebhook] Unexpected webhook processing error:', err)
    return NextResponse.json({ error: err.message || 'Internal webhook error' }, { status: 500 })
  }
}
