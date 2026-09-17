import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptSecret } from '@/lib/security/encrypt'
import {
  verifyDiscordSignature,
  normalizeDiscordEventToIngestPayload
} from '@/lib/providers/discord'
import { ingestMessage } from '@/lib/inbox/ingest'

// GET status check for Discord Webhook
export async function GET(req: NextRequest) {
  return NextResponse.json({
    ok: true,
    service: 'Discord Bot & Webhook Engine',
    timestamp: new Date().toISOString()
  })
}

// POST endpoint for Discord Bot interactions & HTTP webhooks
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

    // 1. Discord Interaction PING challenge response (type: 1)
    if (payload.type === 1) {
      return NextResponse.json({ type: 1 })
    }

    const discordChannelId = payload.channel_id || payload.channel?.id
    const discordGuildId = payload.guild_id || payload.guild?.id

    // Ignore bot author messages to prevent loops
    if (payload.author?.bot || payload.user?.bot) {
      return NextResponse.json({ ok: true, message: 'Ignored bot author message' })
    }

    // 2. Resolve matching active Discord channel from database
    const supabase = await createClient()

    const { data: channels, error: channelError } = await supabase
      .from('communication_channels')
      .select('id, organization_id, external_account_id, metadata, status')
      .eq('provider', 'discord')
      .eq('status', 'active')

    if (channelError || !channels || channels.length === 0) {
      console.warn('[DiscordWebhook] No active Discord channel registered in platform.')
      return NextResponse.json({ ok: true, warning: 'No active Discord channel found' })
    }

    const matchingChannel =
      channels.find((c) => {
        const meta = (c.metadata as Record<string, any>) || {}
        return (
          c.external_account_id === discordChannelId ||
          c.external_account_id === discordGuildId ||
          meta.channel_id === discordChannelId ||
          meta.guild_id === discordGuildId
        )
      }) || channels[0]

    const channelMeta = (matchingChannel.metadata as Record<string, any>) || {}

    // 3. Verify Discord request signature if Public Key is configured
    const signature = req.headers.get('x-signature-ed25519')
    const timestamp = req.headers.get('x-signature-timestamp')
    const encryptedPubKey = channelMeta.public_key || process.env.DISCORD_PUBLIC_KEY || ''
    const publicKey = decryptSecret(encryptedPubKey)

    if (publicKey && signature) {
      const isValid = verifyDiscordSignature(signature, timestamp, rawBody, publicKey)
      if (!isValid) {
        console.warn('[DiscordWebhook] Discord signature verification failed.')
      }
    }

    // 4. Normalize Discord event and Ingest into Communication Hub
    const normalizedPayload = normalizeDiscordEventToIngestPayload(payload)
    const ingestResult = await ingestMessage(matchingChannel.id, normalizedPayload)

    if (!ingestResult.success) {
      console.error('[DiscordWebhook] Ingestion failed:', ingestResult.error)
      return NextResponse.json({ ok: false, error: ingestResult.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message_id: ingestResult.messageId,
      matched_client_id: ingestResult.clientId
    })
  } catch (err: any) {
    console.error('[DiscordWebhook] Unexpected webhook error:', err)
    return NextResponse.json({ error: err.message || 'Internal webhook error' }, { status: 500 })
  }
}
