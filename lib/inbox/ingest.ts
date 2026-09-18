import { createClient } from '@/lib/supabase/server'

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
    const supabase = await createClient()

    // 1. Resolve channel and strictly derive organization_id from DB
    const { data: channel, error: channelError } = await supabase
      .from('communication_channels')
      .select('id, organization_id, provider, status, metadata')
      .eq('id', channelId)
      .single()

    if (channelError || !channel) {
      console.error('[CommunicationHub:Ingest] Channel lookup failed:', channelError?.message || 'Channel not found')
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
      const { data: emailMatch } = await supabase
        .from('clients')
        .select('id, communication_mode')
        .eq('organization_id', orgId)
        .ilike('email', searchEmail)
        .limit(2)

      if (emailMatch && emailMatch.length === 1) {
        // Auto-matching applies exclusively to clients in 'connected' mode
        if (emailMatch[0].communication_mode === 'connected') {
          matchedClientId = emailMatch[0].id
        }
      }
    }

    if (!matchedClientId && searchPhone && searchPhone.length >= 7) {
      // Fetch clients for org to compare normalized phone numbers
      const { data: clients } = await supabase
        .from('clients')
        .select('id, phone, communication_mode')
        .eq('organization_id', orgId)
        .not('phone', 'is', null)

      if (clients && clients.length > 0) {
        const matches = clients.filter((c) => {
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
      const channelMeta = channel.metadata as Record<string, any>
      if (channelMeta.client_id || channelMeta.default_client_id) {
        matchedClientId = channelMeta.client_id || channelMeta.default_client_id
      }
    }

    // 3. Deduplication check via external_message_id if present
    if (payload.external_message_id) {
      const { data: existingMsg } = await supabase
        .from('communication_messages')
        .select('id, client_id, organization_id')
        .eq('organization_id', orgId)
        .eq('channel_id', channelId)
        .eq('external_message_id', payload.external_message_id)
        .maybeSingle()

      if (existingMsg) {
        return {
          success: true,
          messageId: existingMsg.id,
          clientId: existingMsg.client_id,
          organizationId: existingMsg.organization_id,
          message: existingMsg
        }
      }
    }

    // 4. Construct normalized row
    const sentAtDate = payload.sent_at ? new Date(payload.sent_at) : new Date()
    const validSentAt = isNaN(sentAtDate.getTime()) ? new Date().toISOString() : sentAtDate.toISOString()
    const direction = payload.direction || 'inbound'

    const insertData = {
      organization_id: orgId,
      channel_id: channelId,
      client_id: matchedClientId,
      direction,
      sender_name: payload.sender_name || payload.sender_identifier || 'Unknown Sender',
      sender_identifier: payload.sender_identifier,
      body: payload.body || '',
      external_message_id: payload.external_message_id || null,
      metadata: payload.metadata || {},
      sent_at: validSentAt,
      read_at: direction === 'outbound' ? new Date().toISOString() : null
    }

    const { data: insertedMsg, error: insertError } = await supabase
      .from('communication_messages')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('[CommunicationHub:Ingest] Message insert failed:', insertError.message)
      return { success: false, error: insertError.message }
    }

    return {
      success: true,
      messageId: insertedMsg.id,
      clientId: insertedMsg.client_id,
      organizationId: insertedMsg.organization_id,
      message: insertedMsg
    }
  } catch (err: any) {
    console.error('[CommunicationHub:Ingest] Unexpected error:', err)
    return { success: false, error: err.message || 'Failed to ingest message' }
  }
}
