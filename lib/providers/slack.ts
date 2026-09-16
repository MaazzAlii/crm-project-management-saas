import crypto from 'crypto'
import { InboundMessagePayload } from '@/lib/inbox/ingest'

export interface SlackUserInfo {
  id: string
  name?: string
  real_name?: string
  email?: string | null
}

export interface SlackOutboundResponse {
  ok: boolean
  ts?: string
  error?: string
}

/**
 * Verify Slack HTTP Request Signature (X-Slack-Signature & X-Slack-Request-Timestamp)
 */
export function verifySlackSignature(
  signature: string | null,
  timestamp: string | null,
  rawBody: string,
  signingSecret: string
): boolean {
  if (!signature || !timestamp || !signingSecret || !rawBody) {
    return false
  }

  // Prevent replay attacks (reject timestamps older than 5 minutes)
  const reqTimestamp = parseInt(timestamp, 10)
  const currentTimestamp = Math.floor(Date.now() / 1000)
  if (isNaN(reqTimestamp) || Math.abs(currentTimestamp - reqTimestamp) > 300) {
    console.warn('[SlackProvider] Signature timestamp out of bounds:', timestamp)
    return false
  }

  const sigBaseString = `v0:${timestamp}:${rawBody}`
  const hmac = crypto.createHmac('sha256', signingSecret).update(sigBaseString).digest('hex')
  const computedSignature = `v0=${hmac}`

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    )
  } catch (err) {
    return false
  }
}

/**
 * Lookup Slack user profile details (email, real_name) via Slack Web API users.info
 */
export async function getSlackUserInfo(botToken: string, slackUserId: string): Promise<SlackUserInfo | null> {
  if (!botToken || !slackUserId) return null

  try {
    const res = await fetch(`https://slack.com/api/users.info?user=${encodeURIComponent(slackUserId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const data = await res.json()
    if (!data.ok || !data.user) {
      console.warn('[SlackProvider] users.info failed:', data.error)
      return { id: slackUserId }
    }

    const u = data.user
    const email = u.profile?.email || null
    const realName = u.profile?.real_name || u.real_name || u.name

    return {
      id: slackUserId,
      name: u.name,
      real_name: realName,
      email
    }
  } catch (err) {
    console.error('[SlackProvider] Error fetching user info:', err)
    return { id: slackUserId }
  }
}

/**
 * Post outbound reply message to Slack channel via Web API chat.postMessage
 */
export async function sendSlackOutboundMessage(
  botToken: string,
  slackChannelId: string,
  text: string,
  threadTs?: string
): Promise<SlackOutboundResponse> {
  if (!botToken || !slackChannelId || !text) {
    return { ok: false, error: 'Missing required parameters (botToken, slackChannelId, text)' }
  }

  try {
    const bodyPayload: Record<string, any> = {
      channel: slackChannelId,
      text
    }
    if (threadTs) {
      bodyPayload.thread_ts = threadTs
    }

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(bodyPayload)
    })

    const data = await res.json()
    if (!data.ok) {
      console.error('[SlackProvider] chat.postMessage failed:', data.error)
      return { ok: false, error: data.error || 'Slack API error' }
    }

    return {
      ok: true,
      ts: data.ts
    }
  } catch (err: any) {
    console.error('[SlackProvider] Exception in sendSlackOutboundMessage:', err)
    return { ok: false, error: err.message || 'Failed to communicate with Slack' }
  }
}

/**
 * Normalize Slack message event payload to standard InboundMessagePayload
 */
export function normalizeSlackEventToIngestPayload(
  event: any,
  slackUserInfo?: SlackUserInfo | null
): InboundMessagePayload {
  const senderIdentifier = slackUserInfo?.email || event.user || 'slack_user'
  const senderName = slackUserInfo?.real_name || slackUserInfo?.name || event.user || 'Slack User'

  let sentAt: string | undefined = undefined
  if (event.ts) {
    const epochSec = parseFloat(event.ts)
    if (!isNaN(epochSec)) {
      sentAt = new Date(epochSec * 1000).toISOString()
    }
  }

  return {
    provider: 'slack',
    direction: 'inbound',
    sender_name: senderName,
    sender_identifier: senderIdentifier,
    body: event.text || '',
    external_message_id: event.ts || event.event_ts || `slack-${Date.now()}`,
    sent_at: sentAt || new Date().toISOString(),
    metadata: {
      slack_user_id: event.user,
      slack_channel_id: event.channel,
      slack_team_id: event.team || event.team_id,
      thread_ts: event.thread_ts || null,
      client_email: slackUserInfo?.email || null,
      raw_subtype: event.subtype || null
    }
  }
}
