import { query, queryOne } from '@/lib/db'

export type CommunicationProvider = 'slack' | 'whatsapp' | 'email' | 'discord' | 'upwork'
export type MessageDirection = 'inbound' | 'outbound'

export interface InboundMessagePayload {
  provider?: CommunicationProvider
  direction?: MessageDirection
  sender_name?: string | null
  sender_identifier: string
  body: string
  external_message_id?: string | null
  sent_at?: string | Date | null
  metadata?: Record<string, any>
}

export interface IngestMessageResult {
  success: boolean
  messageId?: string
  clientId?: string | null
  organizationId?: string
  error?: string
  message?: any
}

/**
 * Utility to normalize phone numbers for accurate database matching.
 * E.g., "+1 (555) 019-2831" -> "+15550192831"
 */
export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone) return ''
  return phone.replace(/[^\d+]/g, '')
}

/**
 * Core Ingestion Engine for Communication Hub.
 * Takes a registered channelId and provider payload, resolves tenant organization_id,
 * performs auto-matching against clients, and records normalized message.
 */
export async function ingestMessage(
  channelId: string,
  payload: InboundMessagePayload
): Promise<IngestMessageResult> {
  try {
    // 1. Resolve channel and strictly derive organization_id from DB
    const channel = await queryOne<{
      id: string
      organization_id: string
      provider: string
      status: string
      metadata: any
    }>(
      'SELECT id, organization_id, provider, status, metadata FROM communication_channels WHERE id = $1',
      [channelId]
    )

    if (!channel) {
      console.error('[CommunicationHub:Ingest] Channel lookup failed: Channel not found')
      return { success: false, error: `Invalid channel ID: ${channelId}` }
    }

    if (channel.status === 'disconnected') {
      return { success: false, error: `Channel ${channelId} is disconnected` }
    }

    const orgId = channel.organization_id

    // 2. Perform client auto-matching (by email or phone)
    let matchedClientId: string | null = null
    const identifier = payload.sender_identifier ? payload.sender_identifier.trim().toLowerCase() : ''
    const metaEmail = payload.metadata?.client_email ? payload.metadata.client_email.trim().toLowerCase() : ''
    const metaPhone = payload.metadata?.client_phone ? normalizePhoneNumber(payload.metadata.client_phone) : ''

    const searchEmail = identifier.includes('@') ? identifier : metaEmail
    const searchPhone = normalizePhoneNumber(identifier.includes('@') ? metaPhone : identifier)

    if (searchEmail) {
      const emailMatches = await query<{ id: string; communication_mode: string }>(
        'SELECT id, communication_mode FROM clients WHERE organization_id = $1 AND LOWER(email) = $2 LIMIT 2',
        [orgId, searchEmail]
      )

      if (emailMatches.rows.length === 1) {
        if (emailMatches.rows[0].communication_mode === 'connected') {
          matchedClientId = emailMatches.rows[0].id
        }
      }
    }

    if (!matchedClientId && searchPhone && searchPhone.length >= 7) {
      const clientPhones = await query<{ id: string; phone: string; communication_mode: string }>(
        'SELECT id, phone, communication_mode FROM clients WHERE organization_id = $1 AND phone IS NOT NULL',
        [orgId]
      )

      if (clientPhones.rows.length > 0) {
        const matches = clientPhones.rows.filter((c) => {
          const norm = normalizePhoneNumber(c.phone)
          return norm && (norm === searchPhone || norm.endsWith(searchPhone) || searchPhone.endsWith(norm))
        })

        if (matches.length === 1 && matches[0].communication_mode === 'connected') {
          matchedClientId = matches[0].id
        }
      }
    }

    // Fallback: Channel to client routing configured in channel metadata
    if (!matchedClientId && channel.metadata) {
      const channelMeta = typeof channel.metadata === 'string' ? JSON.parse(channel.metadata) : channel.metadata
      if (channelMeta.client_id || channelMeta.default_client_id) {
        matchedClientId = channelMeta.client_id || channelMeta.default_client_id
      }
    }

    // 3. Deduplication check via external_message_id if present
    if (payload.external_message_id) {
      const existingMsg = await queryOne<{ id: string; client_id: string | null; organization_id: string }>(
        'SELECT id, client_id, organization_id FROM communication_messages WHERE organization_id = $1 AND channel_id = $2 AND external_message_id = $3',
        [orgId, channelId, payload.external_message_id]
      )

      if (existingMsg) {
        return {
          success: true,
          messageId: existingMsg.id,
          clientId: existingMsg.client_id,
          organizationId: existingMsg.organization_id,
          message: existingMsg,
        }
      }
    }

    // 4. Construct normalized row
    const sentAtDate = payload.sent_at ? new Date(payload.sent_at) : new Date()
    const validSentAt = isNaN(sentAtDate.getTime()) ? new Date().toISOString() : sentAtDate.toISOString()
    const direction = payload.direction || 'inbound'

    const insertedMsg = await queryOne<{ id: string; client_id: string | null; organization_id: string }>(
      `INSERT INTO communication_messages (
        organization_id, channel_id, client_id, direction,
        sender_name, sender_identifier, body, external_message_id,
        metadata, sent_at, read_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, client_id, organization_id`,
      [
        orgId,
        channelId,
        matchedClientId,
        direction,
        payload.sender_name || payload.sender_identifier || 'Unknown Sender',
        payload.sender_identifier,
        payload.body || '',
        payload.external_message_id || null,
        JSON.stringify(payload.metadata || {}),
        validSentAt,
        direction === 'outbound' ? new Date().toISOString() : null,
      ]
    )

    if (!insertedMsg) {
      return { success: false, error: 'Failed to insert communication message' }
    }

    return {
      success: true,
      messageId: insertedMsg.id,
      clientId: insertedMsg.client_id,
      organizationId: insertedMsg.organization_id,
      message: insertedMsg,
    }
  } catch (err: any) {
    console.error('[CommunicationHub:Ingest] Unexpected error:', err)
    return { success: false, error: err.message || 'Failed to ingest message' }
  }
}
