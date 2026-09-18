'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
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
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized. Session not found.' }
    }

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

    const supabase = await createClient()

    const payload = {
      organization_id: session.organization.id,
      client_id: clientId,
      channel_id: null,
      channel_type: channelType,
      direction,
      sender_name: senderName,
      sender_identifier: senderIdentifier,
      subject,
      body: body || subject || '',
      is_manual: true,
      metadata: { logged_by_user_id: session.user.id, logged_by_name: session.user.full_name },
      sent_at: sentAt,
    }

    let insertedMessage: any = null
    let insertError: any = null

    try {
      const { data, error } = await supabase
        .from('communication_messages')
        .insert(payload)
        .select('*')
        .single()

      insertedMessage = data
      insertError = error
    } catch (err: any) {
      insertError = err
    }

    // Dev mode fallback
    if ((insertError || !insertedMessage) && process.env.DEV_SUPER_ADMIN === 'true') {
      const devRecord: CommunicationItem = {
        id: 'dev-comm-' + Date.now(),
        organization_id: session.organization.id,
        client_id: clientId,
        channel_id: null,
        channel_type: channelType,
        direction,
        sender_name: senderName,
        sender_identifier: senderIdentifier,
        subject,
        body: body || subject || '',
        is_manual: true,
        metadata: { logged_by_user_id: session.user.id, logged_by_name: session.user.full_name },
        sent_at: sentAt,
        created_at: new Date().toISOString(),
      }

      ;(global as any).__DEV_COMMUNICATIONS = (global as any).__DEV_COMMUNICATIONS || []
      ;(global as any).__DEV_COMMUNICATIONS.unshift(devRecord)

      revalidatePath(`/clients/${clientId}`)
      revalidatePath(`/clients/${clientId}/communications`)
      return { success: true, message: devRecord }
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
    console.error('logCommunicationAction error:', error)
    return { error: error?.message || 'Internal server error.' }
  }
}

export async function fetchClientCommunicationsAction(clientId: string): Promise<CommunicationItem[]> {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.organization) {
      return getDevCommunications(clientId)
    }

    const supabase = await createClient()

    let isManualMode = false
    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('communication_mode')
        .eq('id', clientId)
        .eq('organization_id', session.organization.id)
        .single()
      if (clientData?.communication_mode === 'manual') {
        isManualMode = true
      }
    } catch (err) {}

    let items: CommunicationItem[] = []

    try {
      let query = supabase
        .from('communication_messages')
        .select('*')
        .eq('client_id', clientId)
        .eq('organization_id', session.organization.id)

      if (isManualMode) {
        query = query.eq('is_manual', true)
      }

      const { data, error } = await query.order('sent_at', { ascending: false })

      if (!error && data) {
        items = data as CommunicationItem[]
      }
    } catch (err) {}

    // Merge dev mode records if active
    let devItems = getDevCommunications(clientId)
    if (isManualMode) {
      devItems = devItems.filter((item) => item.is_manual)
    }
    const combined = [...items, ...devItems]

    // Deduplicate by ID
    const uniqueMap = new Map<string, CommunicationItem>()
    combined.forEach((item) => uniqueMap.set(item.id, item))

    // Return sorted descending by sent_at
    return Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
    )
  } catch (err) {
    return getDevCommunications(clientId)
  }
}

function getDevCommunications(clientId: string): CommunicationItem[] {
  if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_COMMUNICATIONS) {
    return ((global as any).__DEV_COMMUNICATIONS as CommunicationItem[])
      .filter((item) => item.client_id === clientId)
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
  }

  // Seed sample mock messages if none exist yet for demo
  const mockSeed: CommunicationItem[] = [
    {
      id: 'mock-comm-1',
      organization_id: 'dev-org',
      client_id: clientId,
      channel_type: 'email',
      direction: 'inbound',
      sender_name: 'Client Contact',
      sender_identifier: 'client@example.com',
      subject: 'Project Discovery & Scope Review',
      body: 'Hi team, checking in regarding the upcoming sprint deliverables and launch timeline. Can we schedule a quick call tomorrow?',
      is_manual: false,
      sent_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'mock-comm-2',
      organization_id: 'dev-org',
      client_id: clientId,
      channel_type: 'call',
      direction: 'outbound',
      sender_name: 'Account Executive',
      sender_identifier: 'account.exec@agency.com',
      subject: 'Discovery Call Log',
      body: 'Discussed project requirements, budget allocation ($15,000 USD), and target deployment date. Client confirmed team availability.',
      is_manual: true,
      metadata: { duration_minutes: 25 },
      sent_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'mock-comm-3',
      organization_id: 'dev-org',
      client_id: clientId,
      channel_type: 'whatsapp',
      direction: 'inbound',
      sender_name: 'Client Manager',
      sender_identifier: '+1234567890',
      subject: null,
      body: 'Thanks for sending over the proposal draft! Our board will review it by Friday.',
      is_manual: false,
      sent_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ]

  return mockSeed
}
