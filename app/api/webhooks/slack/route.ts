import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptSecret } from '@/lib/security/encrypt'
import {
  verifySlackSignature,
  getSlackUserInfo,
  normalizeSlackEventToIngestPayload
} from '@/lib/providers/slack'
import { ingestMessage } from '@/lib/inbox/ingest'

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

    // 1. Handle Slack URL Verification Handshake (Challenge Response)
    if (payload.type === 'url_verification') {
      return NextResponse.json({ challenge: payload.challenge })
    }

    // 2. Handle Event Callbacks
    if (payload.type !== 'event_callback' || !payload.event) {
      return NextResponse.json({ ok: true, message: 'Ignored non-event callback payload' })
    }

    const event = payload.event
    const slackChannelId = event.channel
    const slackTeamId = payload.team_id || event.team

    // Ignore bot messages & non-standard subtypes (edits, deletes, bot postings)
    if (
      event.bot_id ||
      event.subtype === 'bot_message' ||
      event.subtype === 'message_changed' ||
      event.subtype === 'message_deleted'
    ) {
      return NextResponse.json({ ok: true, message: 'Ignored bot or system subtype message' })
    }

    // 3. Resolve matching organization channel from database
    const supabase = await createClient()

    // Try finding by Slack Channel ID or Team ID
    const { data: channels, error: channelError } = await supabase
      .from('communication_channels')
      .select('id, organization_id, external_account_id, metadata, status')
      .eq('provider', 'slack')
      .eq('status', 'active')

    if (channelError || !channels || channels.length === 0) {
      console.warn('[SlackWebhook] No active Slack channel registered in platform.')
      return NextResponse.json({ ok: true, warning: 'No active channel found' })
    }

    // Find channel matching external_account_id (slackChannelId or slackTeamId) or fallback to first active slack channel
    const matchingChannel =
      channels.find(
        (c) =>
          c.external_account_id === slackChannelId ||
          c.external_account_id === slackTeamId ||
          (c.metadata as any)?.slack_channel_id === slackChannelId ||
          (c.metadata as any)?.slack_team_id === slackTeamId
      ) || channels[0]

    const channelMeta = (matchingChannel.metadata as Record<string, any>) || {}

    // 4. Verify Slack Request Signature
    const signature = req.headers.get('x-slack-signature')
    const timestamp = req.headers.get('x-slack-request-timestamp')
    const encryptedSecret = channelMeta.signing_secret || process.env.SLACK_SIGNING_SECRET || ''
    const signingSecret = decryptSecret(encryptedSecret)

    if (signingSecret) {
      const isValid = verifySlackSignature(signature, timestamp, rawBody, signingSecret)
      if (!isValid) {
        console.error('[SlackWebhook] Invalid Slack signature verification failed.')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // 5. User lookup (Slack User ID -> Email & Name)
    const encryptedBotToken = channelMeta.bot_access_token || process.env.SLACK_BOT_TOKEN || ''
    const botToken = decryptSecret(encryptedBotToken)
    let slackUserInfo = null

    if (botToken && event.user) {
      slackUserInfo = await getSlackUserInfo(botToken, event.user)
    }

    // 6. Normalize payload and Ingest into Communication Hub
    const normalizedPayload = normalizeSlackEventToIngestPayload(event, slackUserInfo)

    const ingestResult = await ingestMessage(matchingChannel.id, normalizedPayload)

    if (!ingestResult.success) {
      console.error('[SlackWebhook] Ingestion failed:', ingestResult.error)
      return NextResponse.json({ ok: false, error: ingestResult.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message_id: ingestResult.messageId,
      matched_client_id: ingestResult.clientId
    })
  } catch (err: any) {
    console.error('[SlackWebhook] Unexpected webhook processing error:', err)
    return NextResponse.json({ error: err.message || 'Internal webhook error' }, { status: 500 })
  }
}
