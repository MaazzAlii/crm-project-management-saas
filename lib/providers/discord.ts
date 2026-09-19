import crypto from 'crypto'
import { InboundMessagePayload } from '@/lib/inbox/ingest'

export interface DiscordOutboundResponse {
  ok: boolean
  messageId?: string
  error?: string
}

/**
 * Verify Discord Webhook request signature (x-signature-ed25519 & x-signature-timestamp)
 * Spec: https://discord.com/developers/docs/interactions/receiving-and-responding#security-and-authorization
 */
export function verifyDiscordSignature(
  signature: string | null,
  timestamp: string | null,
  rawBody: string,
  publicKeyHex: string
): boolean {
  if (!signature || !timestamp || !rawBody || !publicKeyHex) {
    return false
  }

  // Prevent replay attacks (reject timestamps older than 5 minutes)
  const reqTimestamp = parseInt(timestamp, 10)
  const currentTimestamp = Math.floor(Date.now() / 1000)
  if (isNaN(reqTimestamp) || Math.abs(currentTimestamp - reqTimestamp) > 300) {
    return false
  }

  try {
    const cleanPubHex = publicKeyHex.trim()
    const cleanSigHex = signature.trim()

    if (cleanPubHex.length !== 64 || cleanSigHex.length !== 128) {
      return false
    }

    // Ed25519 SPKI DER prefix: 302a300506032b6570032100 (12 bytes)
    const spkiDer = Buffer.concat([
      Buffer.from('302a300506032b6570032100', 'hex'),
      Buffer.from(cleanPubHex, 'hex'),
    ])

    const publicKey = crypto.createPublicKey({
      key: spkiDer,
      format: 'der',
      type: 'spki',
    })

    const messageBuffer = Buffer.from(timestamp + rawBody, 'utf8')
    const signatureBuffer = Buffer.from(cleanSigHex, 'hex')

    return crypto.verify(null, messageBuffer, publicKey, signatureBuffer)
  } catch (err) {
    console.error('[DiscordProvider] Ed25519 signature verification error:', err)
    return false
  }
}

/**
 * Normalize Discord Message / Webhook event to standard InboundMessagePayload
 */
export function normalizeDiscordEventToIngestPayload(bodyData: Record<string, any>): InboundMessagePayload {
  const author = bodyData.author || bodyData.user || {}
  const senderName = author.global_name || author.username || bodyData.username || 'Discord User'
  const senderIdentifier = author.email || author.username || author.id || 'discord_user'
  const messageBody = bodyData.content || bodyData.message || ''
  const externalId = bodyData.id || `discord-${Date.now()}`

  return {
    provider: 'discord',
    direction: 'inbound',
    sender_name: senderName,
    sender_identifier: senderIdentifier,
    body: messageBody,
    external_message_id: externalId,
    sent_at: bodyData.timestamp || new Date().toISOString(),
    metadata: {
      discord_user_id: author.id || null,
      discord_username: author.username || null,
      discord_channel_id: bodyData.channel_id || null,
      discord_guild_id: bodyData.guild_id || null,
      client_email: author.email || null,
    },
  }
}

/**
 * Post outbound reply message to Discord Channel via Discord REST API v10
 * POST https://discord.com/api/v10/channels/{channel.id}/messages
 */
export async function sendDiscordOutboundMessage(
  botToken: string,
  channelId: string,
  content: string
): Promise<DiscordOutboundResponse> {
  if (!botToken || !channelId || !content) {
    return {
      ok: false,
      error: 'Missing required parameters (botToken, channelId, content)',
    }
  }

  const cleanToken = botToken.startsWith('Bot ') ? botToken : `Bot ${botToken}`
  const discordUrl = `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`

  try {
    const res = await fetch(discordUrl, {
      method: 'POST',
      headers: {
        Authorization: cleanToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    const data = await res.json()
    if (!res.ok || data.code) {
      console.error('[DiscordProvider] Discord API dispatch failed:', data.message || data.code)
      return { ok: false, error: data.message || `Discord API error ${res.status}` }
    }

    return {
      ok: true,
      messageId: data.id,
    }
  } catch (err: any) {
    console.error('[DiscordProvider] Exception in sendDiscordOutboundMessage:', err)
    return { ok: false, error: err.message || 'Failed to dispatch Discord message' }
  }
}
