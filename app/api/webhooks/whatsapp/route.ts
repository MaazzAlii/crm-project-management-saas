import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptSecret } from '@/lib/security/encrypt'
import {
  verifyTwilioSignature,
  normalizeWhatsAppEventToIngestPayload,
  formatE164Phone
} from '@/lib/providers/whatsapp'
import { ingestMessage } from '@/lib/inbox/ingest'

// Handle GET for Webhook challenge verification (Meta / Twilio webhook setup)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && challenge) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'crm_whatsapp_verify_secret'
    if (token === verifyToken) {
      return new NextResponse(challenge, { status: 200 })
    } else {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 })
    }
  }

  return NextResponse.json({ ok: true, service: 'WhatsApp Webhook Engine' })
}

// Handle POST for Inbound WhatsApp Messages (Twilio form-encoded or JSON payload)
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let bodyParams: Record<string, any> = {}
    let rawBody = ''

    if (contentType.includes('application/x-www-form-urlencoded')) {
      rawBody = await req.text()
      const params = new URLSearchParams(rawBody)
      params.forEach((value, key) => {
        bodyParams[key] = value
      })
    } else if (contentType.includes('application/json')) {
      rawBody = await req.text()
      try {
        bodyParams = JSON.parse(rawBody)
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
      }
    } else {
      rawBody = await req.text()
      const params = new URLSearchParams(rawBody)
      params.forEach((value, key) => {
        bodyParams[key] = value
      })
    }

    // Handle Meta payload format vs Twilio payload format
    if (bodyParams.object === 'whatsapp_business_account' && bodyParams.entry) {
      // Meta WhatsApp Cloud API format mapping
      const entry = bodyParams.entry?.[0]
      const changes = entry?.changes?.[0]?.value
      const message = changes?.messages?.[0]
      const contact = changes?.contacts?.[0]

      if (!message) {
        return NextResponse.json({ ok: true, message: 'No message in Meta payload' })
      }

      bodyParams = {
        From: message.from,
        Body: message.text?.body || message.caption || '',
        ProfileName: contact?.profile?.name || message.from,
        MessageSid: message.id,
        AccountSid: changes?.metadata?.phone_number_id || null
      }
    }

    const rawFrom = bodyParams.From || bodyParams.from
    const recipientPhone = bodyParams.To || bodyParams.to
    const accountSid = bodyParams.AccountSid || bodyParams.account_sid

    if (!rawFrom) {
      return NextResponse.json({ ok: true, message: 'Ignored payload without sender phone number' })
    }

    // Resolve matching active WhatsApp communication channel from database
    const supabase = await createClient()

    const { data: channels, error: channelError } = await supabase
      .from('communication_channels')
      .select('id, organization_id, external_account_id, metadata, status')
      .eq('provider', 'whatsapp')
      .eq('status', 'active')

    if (channelError || !channels || channels.length === 0) {
      console.warn('[WhatsAppWebhook] No active WhatsApp channel registered in platform.')
      return NextResponse.json({ ok: true, warning: 'No active WhatsApp channel found' })
    }

    const cleanedRecipient = formatE164Phone(recipientPhone)
    const matchingChannel =
      channels.find((c) => {
        const meta = (c.metadata as Record<string, any>) || {}
        const channelPhone = formatE164Phone(c.external_account_id)
        return (
          channelPhone === cleanedRecipient ||
          meta.account_sid === accountSid ||
          meta.phone_number === cleanedRecipient ||
          c.external_account_id === accountSid
        )
      }) || channels[0]

    const channelMeta = (matchingChannel.metadata as Record<string, any>) || {}

    // Verify Twilio Signature if Auth Token is configured
    const twilioSignature = req.headers.get('x-twilio-signature')
    const encryptedAuthToken = channelMeta.auth_token || process.env.TWILIO_AUTH_TOKEN || ''
    const authToken = decryptSecret(encryptedAuthToken)

    if (authToken && twilioSignature) {
      const fullUrl = req.url
      const isValid = verifyTwilioSignature(twilioSignature, fullUrl, bodyParams, authToken)
      if (!isValid) {
        console.warn('[WhatsAppWebhook] Twilio signature verification failed.')
      }
    }

    // Normalize payload and Ingest into Communication Hub
    const normalizedPayload = normalizeWhatsAppEventToIngestPayload(bodyParams)
    const ingestResult = await ingestMessage(matchingChannel.id, normalizedPayload)

    if (!ingestResult.success) {
      console.error('[WhatsAppWebhook] Ingestion failed:', ingestResult.error)
      return NextResponse.json({ ok: false, error: ingestResult.error }, { status: 500 })
    }

    // Return TwiML response for Twilio or JSON for Meta
    if (contentType.includes('application/x-www-form-urlencoded')) {
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      })
    }

    return NextResponse.json({
      ok: true,
      message_id: ingestResult.messageId,
      matched_client_id: ingestResult.clientId
    })
  } catch (err: any) {
    console.error('[WhatsAppWebhook] Unexpected webhook processing error:', err)
    return NextResponse.json({ error: err.message || 'Internal webhook error' }, { status: 500 })
  }
}
