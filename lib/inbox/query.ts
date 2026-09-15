import { createClient } from '@/lib/supabase/server'
import { CommunicationProvider, MessageDirection } from './ingest'

export interface InboxMessageRecord {
  id: string
  organization_id: string
  channel_id: string
  client_id?: string | null
  direction: MessageDirection
  sender_name?: string | null
  sender_identifier?: string | null
  body: string
  external_message_id?: string | null
  metadata?: Record<string, any>
  sent_at: string
  read_at?: string | null
  created_at: string
  updated_at: string

  // Joined relational data
  channel?: {
    id: string
    provider: CommunicationProvider
    channel_name?: string | null
  } | null
  client?: {
    id: string
    name: string
    company_name?: string | null
    email?: string | null
  } | null
}

export interface FetchInboxMessagesOptions {
  orgId: string
  channelId?: string
  clientId?: string
  provider?: CommunicationProvider
  readStatus?: 'read' | 'unread' | 'all'
  unmatchedOnly?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface InboxSummary {
  totalMessages: number
  unreadCount: number
  unmatchedCount: number
  byProvider: Record<string, number>
}

/**
 * Fetch messages for the unified inbox or client timeline with filtering and pagination.
 */
export async function fetchInboxMessages(options: FetchInboxMessagesOptions): Promise<{
  data: InboxMessageRecord[]
  totalCount: number
  error?: string
}> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('communication_messages')
      .select(
        `
        *,
        channel:communication_channels (
          id,
          provider,
          channel_name
        ),
        client:clients (
          id,
          name,
          company_name,
          email
        )
      `,
        { count: 'exact' }
      )
      .eq('organization_id', options.orgId)

    if (options.channelId) {
      query = query.eq('channel_id', options.channelId)
    }

    if (options.clientId) {
      query = query.eq('client_id', options.clientId)
    }

    if (options.unmatchedOnly) {
      query = query.is('client_id', null)
    }

    if (options.readStatus === 'unread') {
      query = query.is('read_at', null).eq('direction', 'inbound')
    } else if (options.readStatus === 'read') {
      query = query.not('read_at', 'is', null)
    }

    if (options.search) {
      const term = `%${options.search.trim()}%`
      query = query.or(`body.ilike.${term},sender_name.ilike.${term},sender_identifier.ilike.${term}`)
    }

    const limit = options.limit || 50
    const offset = options.offset || 0

    query = query.order('sent_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('[CommunicationHub:Query] Error fetching inbox messages:', error.message)
      return { data: [], totalCount: 0, error: error.message }
    }

    // Filter by provider if specified in options (since channel provider is in joined relation)
    let filteredData = (data as InboxMessageRecord[]) || []
    if (options.provider) {
      filteredData = filteredData.filter((msg) => msg.channel?.provider === options.provider)
    }

    return {
      data: filteredData,
      totalCount: count || filteredData.length
    }
  } catch (err: any) {
    console.error('[CommunicationHub:Query] Unexpected error:', err)
    return { data: [], totalCount: 0, error: err.message || 'Failed to fetch inbox messages' }
  }
}

/**
 * Get aggregated summary metrics for an organization's Communication Hub.
 */
export async function getInboxSummary(orgId: string): Promise<InboxSummary> {
  const defaultSummary: InboxSummary = {
    totalMessages: 0,
    unreadCount: 0,
    unmatchedCount: 0,
    byProvider: {
      slack: 0,
      whatsapp: 0,
      email: 0,
      discord: 0,
      upwork: 0
    }
  }

  try {
    const supabase = await createClient()

    // 1. Total count
    const { count: totalMessages } = await supabase
      .from('communication_messages')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)

    // 2. Unread count (inbound & read_at is null)
    const { count: unreadCount } = await supabase
      .from('communication_messages')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('direction', 'inbound')
      .is('read_at', null)

    // 3. Unmatched count (client_id is null)
    const { count: unmatchedCount } = await supabase
      .from('communication_messages')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .is('client_id', null)

    // 4. Counts by provider
    const { data: messages } = await supabase
      .from('communication_messages')
      .select('id, channel:communication_channels ( provider )')
      .eq('organization_id', orgId)

    const byProvider: Record<string, number> = {
      slack: 0,
      whatsapp: 0,
      email: 0,
      discord: 0,
      upwork: 0
    }

    if (messages) {
      messages.forEach((m: any) => {
        const prov = m.channel?.provider
        if (prov && byProvider[prov] !== undefined) {
          byProvider[prov]++
        }
      })
    }

    return {
      totalMessages: totalMessages || 0,
      unreadCount: unreadCount || 0,
      unmatchedCount: unmatchedCount || 0,
      byProvider
    }
  } catch (err: any) {
    console.error('[CommunicationHub:Query] Error getting inbox summary:', err)
    return defaultSummary
  }
}

/**
 * Mark a single message as read.
 */
export async function markMessageRead(messageId: string, orgId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('communication_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('organization_id', orgId)

    if (error) {
      console.error('[CommunicationHub:Query] Error marking message read:', error.message)
      return false
    }
    return true
  } catch (err) {
    return false
  }
}

/**
 * Mark all unread messages in an organization (or specific channel) as read.
 */
export async function markAllMessagesRead(orgId: string, channelId?: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('communication_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('organization_id', orgId)
      .is('read_at', null)

    if (channelId) {
      query = query.eq('channel_id', channelId)
    }

    const { error } = await query

    if (error) {
      console.error('[CommunicationHub:Query] Error marking all read:', error.message)
      return false
    }
    return true
  } catch (err) {
    return false
  }
}

/**
 * Assign an unmatched message to a client profile.
 */
export async function assignMessageClient(
  messageId: string,
  clientId: string,
  orgId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('communication_messages')
      .update({ client_id: clientId })
      .eq('id', messageId)
      .eq('organization_id', orgId)

    if (error) {
      console.error('[CommunicationHub:Query] Error assigning message client:', error.message)
      return false
    }
    return true
  } catch (err) {
    return false
  }
}
