import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeUpworkEventToIngestPayload } from '@/lib/providers/upwork'
import { ingestMessage } from '@/lib/inbox/ingest'

// GET status check for Upwork Webhook
export async function GET(req: NextRequest) {
  return NextResponse.json({
    ok: true,
    service: 'Upwork Direct Contracts & Webhook Engine',
    timestamp: new Date().toISOString()
  })
}

// POST endpoint for Upwork webhook notifications & manual contract logs
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    if (!rawBody) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 })
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const upworkContractId = payload.contract_id || payload.room_id || payload.event?.contract_id

    // Resolve matching active Upwork channel from database
    const supabase = await createClient()

    const { data: channels, error: channelError } = await supabase
      .from('communication_channels')
      .select('id, organization_id, external_account_id, metadata, status')
      .eq('provider', 'upwork')
      .eq('status', 'active')

    if (channelError || !channels || channels.length === 0) {
      console.warn('[UpworkWebhook] No active Upwork channel registered in platform.')
      return NextResponse.json({ ok: true, warning: 'No active Upwork channel found' })
    }

    const matchingChannel =
      channels.find((c) => {
        const meta = (c.metadata as Record<string, any>) || {}
        return (
          c.external_account_id === upworkContractId ||
          meta.contract_id === upworkContractId ||
          meta.room_id === upworkContractId
        )
      }) || channels[0]

    // Normalize Upwork event and Ingest into Communication Hub
    const normalizedPayload = normalizeUpworkEventToIngestPayload(payload)
    const ingestResult = await ingestMessage(matchingChannel.id, normalizedPayload)

    if (!ingestResult.success) {
      console.error('[UpworkWebhook] Ingestion failed:', ingestResult.error)
      return NextResponse.json({ ok: false, error: ingestResult.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message_id: ingestResult.messageId,
      matched_client_id: ingestResult.clientId
    })
  } catch (err: any) {
    console.error('[UpworkWebhook] Unexpected webhook error:', err)
    return NextResponse.json({ error: err.message || 'Internal webhook error' }, { status: 500 })
  }
}
