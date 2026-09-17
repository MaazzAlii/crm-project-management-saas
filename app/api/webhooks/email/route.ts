import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  parseEmailAddressHeader,
  normalizeEmailEventToIngestPayload
} from '@/lib/providers/email'
import { ingestMessage } from '@/lib/inbox/ingest'

// GET status check for Email Inbound Webhook
export async function GET(req: NextRequest) {
  return NextResponse.json({
    ok: true,
    service: 'Email Inbound Parse Webhook Engine',
    timestamp: new Date().toISOString()
  })
}

// POST endpoint for Inbound Parse Email Webhooks (SendGrid, Postmark, Mailgun, n8n)
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let bodyParams: Record<string, any> = {}

    if (contentType.includes('application/json')) {
      try {
        bodyParams = await req.json()
      } catch (e) {
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
      sender_email: parsedSender.email
    })
  } catch (err: any) {
    console.error('[EmailWebhook] Unexpected webhook processing error:', err)
    return NextResponse.json({ error: err.message || 'Internal webhook error' }, { status: 500 })
  }
}
