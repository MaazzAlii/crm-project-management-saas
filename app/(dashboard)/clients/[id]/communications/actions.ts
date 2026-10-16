'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { requireRole } from '@/lib/auth/server-guard'
import { query, queryOne } from '@/lib/db'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'

export interface CommunicationItem {
  id: string
  organization_id: string
  client_id: string
  channel_id?: string | null
  channel_type: string
  direction: 'inbound' | 'outbound'
  sender_name?: string | null
  sender_identifier?: string | null
  subject?: string | null
  body: string
  is_manual: boolean
  metadata?: Record<string, any>
  sent_at: string
  read_at?: string | null
  created_at: string
}

export async function logCommunicationAction(formData: FormData) {
  const session = await requireRole(['owner', 'admin', 'member'])

  const clientId = formData.get('client_id')?.toString().trim()
  const channelType = formData.get('channel_type')?.toString().trim() || 'email'
  const direction = (formData.get('direction')?.toString().trim() || 'outbound') as 'inbound' | 'outbound'
  const subject = formData.get('subject')?.toString().trim() || null
  const body = formData.get('body')?.toString().trim()
  const senderName = formData.get('sender_name')?.toString().trim() || session.user.full_name || session.user.email
  const senderIdentifier = formData.get('sender_identifier')?.toString().trim() || session.user.email
  const sentAtInput = formData.get('sent_at')?.toString().trim()
  const sentAt = sentAtInput ? new Date(sentAtInput).toISOString() : new Date().toISOString()

  if (!clientId) {
    return { error: 'Client ID is required.' }
  }

  if (!body && !subject) {
    return { error: 'Communication log must include a message body or subject.' }
  }

  // Cross-tenant verification: parent client must belong to the caller's organization
  const parent = await queryOne<{ id: string }>(
    'SELECT id FROM clients WHERE id = $1 AND organization_id = $2',
    [clientId, session.organization.id]
  )
  if (!parent) {
    throw new Error('NOT_FOUND')
  }

  try {
    let insertedMessage: any = null
    let insertError: any = null

    try {
      insertedMessage = await queryOne<CommunicationItem>(
        `INSERT INTO communication_messages (
          organization_id, client_id, channel_id, channel_type, direction,
          sender_name, sender_identifier, subject, body, is_manual,
          metadata, sent_at, created_at
        ) VALUES (
          $1, $2, null, $3, $4, $5, $6, $7, $8, true, $9, $10, NOW()
        ) RETURNING *`,
        [
          session.organization.id,
          clientId,
          channelType,
          direction,
          senderName,
          senderIdentifier,
          subject,
          body || subject || '',
          JSON.stringify({ logged_by_user_id: session.user.id, logged_by_name: session.user.full_name }),
          sentAt,
        ]
      )
    } catch (err: any) {
      insertError = err
    }

    if (insertError || !insertedMessage) {
      console.error('Failed to log communication message:', insertError)
      return { error: insertError?.message || 'Database error while logging communication.' }
    }

    // Log audit event
    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'COMMUNICATION_LOGGED',
        targetType: 'client',
        targetId: clientId,
        details: {
          channelType,
          direction,
          subject,
          organizationId: session.organization.id,
        },
      })
    } catch (e) {}

    revalidatePath(`/clients/${clientId}`)
    revalidatePath(`/clients/${clientId}/communications`)
    return { success: true, message: insertedMessage }
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED' || error.message === 'INSUFFICIENT_ROLE' || error.message === 'NOT_FOUND') {
      throw error
    }
    console.error('logCommunicationAction error:', error)
    return { error: error?.message || 'Internal server error.' }
  }
}

export async function fetchClientCommunicationsAction(clientId: string): Promise<CommunicationItem[]> {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.organization) {
      return []
    }

    let isManualMode = false
    try {
      const clientData = await queryOne<{ communication_mode: string }>(
        `SELECT communication_mode FROM clients WHERE id = $1 AND organization_id = $2`,
        [clientId, session.organization.id]
      )
      if (clientData?.communication_mode === 'manual') {
        isManualMode = true
      }
    } catch (err) {}

    let items: CommunicationItem[] = []

    try {
      let data: CommunicationItem[]
      if (isManualMode) {
        data = await query<CommunicationItem>(
          `SELECT * FROM communication_messages
           WHERE client_id = $1 AND organization_id = $2 AND is_manual = true
           ORDER BY sent_at DESC`,
          [clientId, session.organization.id]
        )
      } else {
        data = await query<CommunicationItem>(
          `SELECT * FROM communication_messages
           WHERE client_id = $1 AND organization_id = $2
           ORDER BY sent_at DESC`,
          [clientId, session.organization.id]
        )
      }

      if (data) {
        items = data
      }
    } catch (err) {}

    return items
  } catch (err) {
    return []
  }
}

