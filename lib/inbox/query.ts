import { query, queryOne } from '@/lib/db'
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
    status?: string | null
    connected_at?: string | null
    updated_at?: string | null
    external_account_id?: string | null
    metadata?: Record<string, any> | null
  } | null
  client?: {
    id: string
    name: string
    company_name?: string | null
    email?: string | null
    communication_mode?: 'manual' | 'connected'
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
  unreadByProvider: Record<string, number>
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
    const conditions: string[] = ['m.organization_id = $1']
    const params: any[] = [options.orgId]
    let paramIdx = 2

    if (options.channelId) {
      conditions.push(`m.channel_id = $${paramIdx++}`)
      params.push(options.channelId)
    }

    if (options.clientId) {
      conditions.push(`m.client_id = $${paramIdx++}`)
      params.push(options.clientId)
    }

    if (options.unmatchedOnly) {
      conditions.push('m.client_id IS NULL')
    }

    if (options.readStatus === 'unread') {
      conditions.push("m.read_at IS NULL AND m.direction = 'inbound'")
    } else if (options.readStatus === 'read') {
      conditions.push('m.read_at IS NOT NULL')
    }

    if (options.provider) {
      conditions.push(`ch.provider = $${paramIdx++}`)
      params.push(options.provider)
    }

    if (options.search) {
      const term = `%${options.search.trim()}%`
      conditions.push(`(m.body ILIKE $${paramIdx} OR m.sender_name ILIKE $${paramIdx} OR m.sender_identifier ILIKE $${paramIdx})`)
      params.push(term)
      paramIdx++
    }

    const whereClause = conditions.join(' AND ')

    const countSql = `
      SELECT COUNT(*) as count
      FROM communication_messages m
      LEFT JOIN communication_channels ch ON ch.id = m.channel_id
      WHERE ${whereClause}
    `
    const countRes = await queryOne<{ count: string }>(countSql, params)
    const totalCount = parseInt(countRes?.count || '0', 10)

    const limit = options.limit || 50
    const offset = options.offset || 0

    const dataSql = `
      SELECT 
        m.*,
        row_to_json(ch.*) as channel,
        row_to_json(cl.*) as client
      FROM communication_messages m
      LEFT JOIN communication_channels ch ON ch.id = m.channel_id
      LEFT JOIN clients cl ON cl.id = m.client_id
      WHERE ${whereClause}
      ORDER BY m.sent_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `
    const dataParams = [...params, limit, offset]
    const dataRes = await query<any>(dataSql, dataParams)

    const formattedData: InboxMessageRecord[] = dataRes.rows.map((row) => ({
      ...row,
      channel: row.channel ? {
        id: row.channel.id,
        provider: row.channel.provider,
        channel_name: row.channel.channel_name,
        status: row.channel.status,
        connected_at: row.channel.connected_at,
        updated_at: row.channel.updated_at,
        external_account_id: row.channel.external_account_id,
        metadata: row.channel.metadata,
      } : null,
      client: row.client ? {
        id: row.client.id,
        name: row.client.name,
        company_name: row.client.company || row.client.company_name,
        email: row.client.email,
        communication_mode: row.client.communication_mode,
      } : null,
    }))

    return {
      data: formattedData,
      totalCount,
    }
  } catch (err: any) {
    console.error('[CommunicationHub:Query] Unexpected error fetching inbox messages:', err)
    return { data: [], totalCount: 0, error: err.message || 'Unknown query error' }
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
      upwork: 0,
    },
    unreadByProvider: {
      slack: 0,
      whatsapp: 0,
      email: 0,
      discord: 0,
      upwork: 0,
    },
  }

  try {
    const [
      totalRes,
      unreadRes,
      unmatchedRes,
      providersRes,
    ] = await Promise.all([
      queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM communication_messages WHERE organization_id = $1',
        [orgId]
      ),
      queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM communication_messages WHERE organization_id = $1 AND direction = 'inbound' AND read_at IS NULL",
        [orgId]
      ),
      queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM communication_messages WHERE organization_id = $1 AND client_id IS NULL',
        [orgId]
      ),
      query<{ provider: string; is_unread: boolean; count: string }>(
        `SELECT ch.provider, (m.read_at IS NULL AND m.direction = 'inbound') as is_unread, COUNT(*) as count
         FROM communication_messages m
         JOIN communication_channels ch ON ch.id = m.channel_id
         WHERE m.organization_id = $1
         GROUP BY ch.provider, (m.read_at IS NULL AND m.direction = 'inbound')`,
        [orgId]
      ),
    ])

    const byProvider: Record<string, number> = {
      slack: 0,
      whatsapp: 0,
      email: 0,
      discord: 0,
      upwork: 0,
    }

    const unreadByProvider: Record<string, number> = {
      slack: 0,
      whatsapp: 0,
      email: 0,
      discord: 0,
      upwork: 0,
    }

    providersRes.rows.forEach((row) => {
      const p = row.provider
      const cnt = parseInt(row.count, 10)
      if (byProvider[p] !== undefined) {
        byProvider[p] += cnt
        if (row.is_unread) {
          unreadByProvider[p] += cnt
        }
      }
    })

    return {
      totalMessages: parseInt(totalRes?.count || '0', 10),
      unreadCount: parseInt(unreadRes?.count || '0', 10),
      unmatchedCount: parseInt(unmatchedRes?.count || '0', 10),
      byProvider,
      unreadByProvider,
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
    const res = await query(
      'UPDATE communication_messages SET read_at = NOW() WHERE id = $1 AND organization_id = $2',
      [messageId, orgId]
    )
    return (res.rowCount ?? 0) > 0
  } catch (err) {
    return false
  }
}

/**
 * Mark all unread messages in an organization (or specific channel) as read.
 */
export async function markAllMessagesRead(orgId: string, channelId?: string): Promise<boolean> {
  try {
    let sql = 'UPDATE communication_messages SET read_at = NOW() WHERE organization_id = $1 AND read_at IS NULL'
    const params: any[] = [orgId]

    if (channelId) {
      sql += ' AND channel_id = $2'
      params.push(channelId)
    }

    const res = await query(sql, params)
    return (res.rowCount ?? 0) > 0
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
    const res = await query(
      'UPDATE communication_messages SET client_id = $1 WHERE id = $2 AND organization_id = $3',
      [clientId, messageId, orgId]
    )

    if ((res.rowCount ?? 0) === 0) {
      return false
    }

    // Manual triage: linking an unmatched message flips the client to connected mode
    try {
      await query(
        `UPDATE clients
         SET communication_mode = 'connected', updated_at = NOW()
         WHERE id = $1 AND organization_id = $2 AND communication_mode = 'manual'`,
        [clientId, orgId]
      )
    } catch (e) {}

    return true
  } catch (err) {
    return false
  }
}
