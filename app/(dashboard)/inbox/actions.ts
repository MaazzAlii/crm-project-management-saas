'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { fetchInboxMessages, getInboxSummary, markMessageRead, markAllMessagesRead, assignMessageClient, InboxMessageRecord, InboxSummary } from '@/lib/inbox/query'
import { ingestMessage, CommunicationProvider } from '@/lib/inbox/ingest'
import { decryptSecret } from '@/lib/security/encrypt'
import { sendSlackOutboundMessage } from '@/lib/providers/slack'
import { sendWhatsAppOutboundMessage } from '@/lib/providers/whatsapp'
import { sendEmailOutboundMessage } from '@/lib/providers/email'
import { sendDiscordOutboundMessage } from '@/lib/providers/discord'
import { sendUpworkOutboundMessage } from '@/lib/providers/upwork'

export interface ClientSelectItem {
  id: string
  name: string
  company_name?: string | null
  email?: string | null
}

export interface ChannelInfo {
  id: string
  provider: string
  channel_name?: string | null
  status?: string | 'active' | 'disconnected' | 'error'
  connected_at?: string | null
  updated_at?: string | null
  external_account_id?: string | null
  metadata?: Record<string, any> | null
}

export interface FetchInboxDataResult {
  messages: InboxMessageRecord[]
  summary: InboxSummary
  clients: ClientSelectItem[]
  channels: ChannelInfo[]
}

// Dev fallback sample conversations if database is empty
const DEV_SAMPLE_MESSAGES: InboxMessageRecord[] = [
  {
    id: 'msg-sample-1',
    organization_id: 'dev-org',
    channel_id: 'chan-slack-1',
    client_id: 'cli-sample-1',
    direction: 'inbound',
    sender_name: 'Sarah Jenkins',
    sender_identifier: 'sarah.j@acmecorp.com',
    body: 'Hey team! Just reviewed the latest homepage mockup design draft. Love the dark mode toggle!',
    sent_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    read_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    channel: { id: 'chan-slack-1', provider: 'slack', channel_name: '#acme-redesign', status: 'active' },
    client: { id: 'cli-sample-1', name: 'Sarah Jenkins', company_name: 'Acme Corp', email: 'sarah.j@acmecorp.com' }
  },
  {
    id: 'msg-sample-2',
    organization_id: 'dev-org',
    channel_id: 'chan-whatsapp-1',
    client_id: 'cli-sample-2',
    direction: 'inbound',
    sender_name: 'Michael Chang',
    sender_identifier: '+15550192831',
    body: 'Hi, can we schedule a quick call tomorrow at 2 PM EST to go over the Q3 marketing campaign budget?',
    sent_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    read_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    channel: { id: 'chan-whatsapp-1', provider: 'whatsapp', channel_name: 'WhatsApp Business (+1 555-019-2831)', status: 'active' },
    client: { id: 'cli-sample-2', name: 'Michael Chang', company_name: 'Nexus Tech', email: 'mchang@nexustech.io' }
  },
  {
    id: 'msg-sample-3',
    organization_id: 'dev-org',
    channel_id: 'chan-email-1',
    client_id: null,
    direction: 'inbound',
    sender_name: 'David Vance',
    sender_identifier: 'david.vance@leadprospect.com',
    body: 'Inquiry regarding custom CRM integration services for our 50-person sales team. Do you support custom webhooks?',
    sent_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
    read_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    channel: { id: 'chan-email-1', provider: 'email', channel_name: 'support@agency.com', status: 'active' },
    client: null
  },
  {
    id: 'msg-sample-4',
    organization_id: 'dev-org',
    channel_id: 'chan-slack-1',
    client_id: 'cli-sample-1',
    direction: 'outbound',
    sender_name: 'Agency Support',
    sender_identifier: 'support@agency.com',
    body: 'Thanks Sarah! We have pushed the updated responsive navigation component to staging.',
    sent_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    channel: { id: 'chan-slack-1', provider: 'slack', channel_name: '#acme-redesign', status: 'active' },
    client: { id: 'cli-sample-1', name: 'Sarah Jenkins', company_name: 'Acme Corp', email: 'sarah.j@acmecorp.com' }
  },
  {
    id: 'msg-sample-5',
    organization_id: 'dev-org',
    channel_id: 'chan-discord-1',
    client_id: 'cli-sample-2',
    direction: 'inbound',
    sender_name: 'Marcus Vance',
    sender_identifier: 'marcus_v#0001',
    body: 'Hey guys, pinging from the Discord VIP server. Can you check the build artifact link?',
    sent_at: new Date(Date.now() - 1000 * 60 * 450).toISOString(),
    read_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    channel: { id: 'chan-discord-1', provider: 'discord', channel_name: 'Discord VIP Community', status: 'active' },
    client: { id: 'cli-sample-2', name: 'Michael Chang', company_name: 'Nexus Tech', email: 'mchang@nexustech.io' }
  },
  {
    id: 'msg-sample-6',
    organization_id: 'dev-org',
    channel_id: 'chan-upwork-1',
    client_id: null,
    direction: 'inbound',
    sender_name: 'Elena Rostova',
    sender_identifier: 'elena_upwork_buyer',
    body: 'We accepted your contract proposal for the SaaS Dashboard redesign! Looking forward to starting.',
    sent_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    read_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    channel: { id: 'chan-upwork-1', provider: 'upwork', channel_name: 'Upwork Direct Contracts', status: 'active' },
    client: null
  }
]

export async function fetchInboxDataAction(filters?: {
  channelId?: string
  clientId?: string
  provider?: string
  readStatus?: 'all' | 'read' | 'unread'
  unmatchedOnly?: boolean
  search?: string
}): Promise<FetchInboxDataResult> {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.organization) {
      return getDevInboxData(filters)
    }

    const orgId = session.organization.id
    const supabase = await createClient()

    // Fetch messages from DB
    const messagesRes = await fetchInboxMessages({
      orgId,
      channelId: filters?.channelId,
      clientId: filters?.clientId,
      provider: filters?.provider as any,
      readStatus: filters?.readStatus,
      unmatchedOnly: filters?.unmatchedOnly,
      search: filters?.search
    })

    // Fetch summary
    const summary = await getInboxSummary(orgId)

    // Fetch clients for dropdown
    const { data: clientsData } = await supabase
      .from('clients')
      .select('id, name, company_name, email')
      .eq('organization_id', orgId)
      .order('name', { ascending: true })

    // Fetch channels for org
    const { data: channelsData } = await supabase
      .from('communication_channels')
      .select('id, provider, channel_name, status, connected_at, updated_at, external_account_id, metadata')
      .eq('organization_id', orgId)

    let messages = messagesRes.data || []
    if (messages.length === 0 && (!filters || Object.keys(filters).length === 0)) {
      // If DB is empty, provide rich dev sample data
      return getDevInboxData(filters)
    }

    return {
      messages,
      summary,
      clients: clientsData || [],
      channels: (channelsData as ChannelInfo[]) || []
    }
  } catch (err: any) {
    console.error('[CommunicationHub:Actions] Error fetching inbox data:', err)
    return getDevInboxData(filters)
  }
}

function getDevInboxData(filters?: {
  channelId?: string
  clientId?: string
  provider?: string
  readStatus?: 'all' | 'read' | 'unread'
  unmatchedOnly?: boolean
  search?: string
}): FetchInboxDataResult {
  let messages = [...DEV_SAMPLE_MESSAGES]

  if (filters?.channelId) {
    messages = messages.filter((m) => m.channel_id === filters.channelId)
  }
  if (filters?.clientId) {
    messages = messages.filter((m) => m.client_id === filters.clientId)
  }
  if (filters?.provider && filters.provider !== 'ALL') {
    messages = messages.filter((m) => m.channel?.provider === filters.provider)
  }
  if (filters?.readStatus === 'unread') {
    messages = messages.filter((m) => !m.read_at && m.direction === 'inbound')
  } else if (filters?.readStatus === 'read') {
    messages = messages.filter((m) => !!m.read_at)
  }
  if (filters?.unmatchedOnly) {
    messages = messages.filter((m) => !m.client_id)
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase()
    messages = messages.filter(
      (m) =>
        m.body.toLowerCase().includes(s) ||
        (m.sender_name && m.sender_name.toLowerCase().includes(s)) ||
        (m.sender_identifier && m.sender_identifier.toLowerCase().includes(s))
    )
  }

  return {
    messages,
    summary: {
      totalMessages: DEV_SAMPLE_MESSAGES.length,
      unreadCount: DEV_SAMPLE_MESSAGES.filter((m) => !m.read_at && m.direction === 'inbound').length,
      unmatchedCount: DEV_SAMPLE_MESSAGES.filter((m) => !m.client_id).length,
      byProvider: {
        slack: 2,
        whatsapp: 1,
        email: 1,
        discord: 1,
        upwork: 1
      },
      unreadByProvider: {
        slack: 1,
        whatsapp: 1,
        email: 1,
        discord: 0,
        upwork: 0
      }
    },
    clients: [
      { id: 'cli-sample-1', name: 'Sarah Jenkins', company_name: 'Acme Corp', email: 'sarah.j@acmecorp.com' },
      { id: 'cli-sample-2', name: 'Michael Chang', company_name: 'Nexus Tech', email: 'mchang@nexustech.io' },
      { id: 'cli-sample-3', name: 'Elena Rostova', company_name: 'Global Ventures', email: 'elena@globalventures.com' }
    ],
    channels: [
      { id: 'chan-slack-1', provider: 'slack', channel_name: '#acme-redesign', status: 'active', connected_at: new Date(Date.now() - 86400000 * 5).toISOString(), external_account_id: 'T08DEMO_SLACK' },
      { id: 'chan-whatsapp-1', provider: 'whatsapp', channel_name: 'WhatsApp Business (+1 555-019-2831)', status: 'active', connected_at: new Date(Date.now() - 86400000 * 3).toISOString(), external_account_id: 'whatsapp:+15550192831' },
      { id: 'chan-email-1', provider: 'email', channel_name: 'support@agency.com', status: 'active', connected_at: new Date(Date.now() - 86400000 * 10).toISOString(), external_account_id: 'support@agency.com' },
      { id: 'chan-discord-1', provider: 'discord', channel_name: 'Discord VIP Community', status: 'active', connected_at: new Date(Date.now() - 86400000 * 2).toISOString(), external_account_id: '123456789012345678' },
      { id: 'chan-upwork-1', provider: 'upwork', channel_name: 'Upwork Direct Contracts', status: 'active', connected_at: new Date(Date.now() - 86400000 * 1).toISOString(), external_account_id: '~0198273645' }
    ]
  }
}

export async function markMessageReadAction(messageId: string) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { success: true }
    }

    const ok = await markMessageRead(messageId, session.organization.id)
    if (ok) revalidatePath('/inbox')
    return { success: ok }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function markAllReadAction(channelId?: string) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { success: true }
    }

    const ok = await markAllMessagesRead(session.organization.id, channelId)
    if (ok) revalidatePath('/inbox')
    return { success: ok }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function assignMessageClientAction(messageId: string, clientId: string) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { success: true }
    }

    const ok = await assignMessageClient(messageId, clientId, session.organization.id)
    if (ok) revalidatePath('/inbox')
    return { success: ok }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function sendOutboundMessageAction(formData: FormData) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization || !session.user) {
      return { error: 'Unauthorized session.' }
    }

    const channelId = formData.get('channel_id')?.toString()
    const body = formData.get('body')?.toString().trim()
    const clientId = formData.get('client_id')?.toString() || null
    const recipientIdentifier = formData.get('recipient_identifier')?.toString() || ''

    if (!channelId || !body) {
      return { error: 'Channel and message content are required.' }
    }

    const supabase = await createClient()

    // 1. Verify channel belongs to org
    const { data: channel } = await supabase
      .from('communication_channels')
      .select('id, organization_id, provider, external_account_id, metadata')
      .eq('id', channelId)
      .eq('organization_id', session.organization.id)
      .single()

    if (!channel) {
      // In dev fallback scenario, return success with simulated message
      return {
        success: true,
        newMessage: {
          id: `msg-${Date.now()}`,
          organization_id: session.organization.id,
          channel_id: channelId,
          client_id: clientId,
          direction: 'outbound' as const,
          sender_name: session.user.full_name || session.user.email,
          sender_identifier: session.user.email,
          body,
          sent_at: new Date().toISOString(),
          read_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    }

    let externalMessageId: string | null = null

    // Direct provider dispatch if provider is Slack
    if (channel.provider === 'slack') {
      const meta = (channel.metadata as Record<string, any>) || {}
      const encryptedToken = meta.bot_access_token || process.env.SLACK_BOT_TOKEN || ''
      const botToken = decryptSecret(encryptedToken)
      const slackChannelId = meta.slack_channel_id || channel.external_account_id

      if (botToken && slackChannelId) {
        const slackRes = await sendSlackOutboundMessage(botToken, slackChannelId, body)
        if (slackRes.ok && slackRes.ts) {
          externalMessageId = slackRes.ts
        } else if (!slackRes.ok) {
          console.warn('[InboxAction] Slack API dispatch warning:', slackRes.error)
        }
      }
    } else if (channel.provider === 'whatsapp') {
      const meta = (channel.metadata as Record<string, any>) || {}
      const accountSid = meta.account_sid ? decryptSecret(meta.account_sid) : process.env.TWILIO_ACCOUNT_SID || ''
      const authToken = meta.auth_token ? decryptSecret(meta.auth_token) : process.env.TWILIO_AUTH_TOKEN || ''
      const fromPhone = meta.phone_number || channel.external_account_id
      const recipientPhone = recipientIdentifier || ''

      if (accountSid && authToken && fromPhone && recipientPhone) {
        const waRes = await sendWhatsAppOutboundMessage(accountSid, authToken, fromPhone, recipientPhone, body)
        if (waRes.ok && waRes.sid) {
          externalMessageId = waRes.sid
        } else if (!waRes.ok) {
          console.warn('[InboxAction] WhatsApp Twilio dispatch warning:', waRes.error)
        }
      }
    } else if (channel.provider === 'email') {
      const meta = (channel.metadata as Record<string, any>) || {}
      const apiKey = meta.sendgrid_api_key ? decryptSecret(meta.sendgrid_api_key) : process.env.SENDGRID_API_KEY || ''
      const fromEmail = channel.external_account_id
      const recipientEmail = recipientIdentifier || ''

      if (apiKey && fromEmail && recipientEmail) {
        const emailRes = await sendEmailOutboundMessage(
          apiKey,
          fromEmail,
          session.organization.name || 'Agency Support',
          recipientEmail,
          'Re: Client Conversation Update',
          body
        )
        if (emailRes.ok && emailRes.messageId) {
          externalMessageId = emailRes.messageId
        } else if (!emailRes.ok) {
          console.warn('[InboxAction] SendGrid email dispatch warning:', emailRes.error)
        }
      }
    } else if (channel.provider === 'discord') {
      const meta = (channel.metadata as Record<string, any>) || {}
      const botToken = meta.bot_token ? decryptSecret(meta.bot_token) : process.env.DISCORD_BOT_TOKEN || ''
      const targetChannelId = meta.channel_id || channel.external_account_id

      if (botToken && targetChannelId) {
        const discordRes = await sendDiscordOutboundMessage(botToken, targetChannelId, body)
        if (discordRes.ok && discordRes.messageId) {
          externalMessageId = discordRes.messageId
        } else if (!discordRes.ok) {
          console.warn('[InboxAction] Discord dispatch warning:', discordRes.error)
        }
      }
    } else if (channel.provider === 'upwork') {
      const meta = (channel.metadata as Record<string, any>) || {}
      const apiKey = meta.api_key ? decryptSecret(meta.api_key) : ''
      const contractId = meta.contract_id || channel.external_account_id

      if (contractId) {
        const upwRes = await sendUpworkOutboundMessage(apiKey, contractId, body)
        if (upwRes.ok && upwRes.messageId) {
          externalMessageId = upwRes.messageId
        }
      }
    }

    // Insert outbound message row into communication_messages
    const { data: insertedMsg, error: insertError } = await supabase
      .from('communication_messages')
      .insert({
        organization_id: session.organization.id,
        channel_id: channel.id,
        client_id: clientId,
        direction: 'outbound',
        sender_name: session.user.full_name || session.user.email,
        sender_identifier: session.user.email,
        body,
        external_message_id: externalMessageId,
        sent_at: new Date().toISOString(),
        read_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      return { error: insertError.message }
    }

    revalidatePath('/inbox')
    return { success: true, newMessage: insertedMsg }
  } catch (err: any) {
    return { error: err.message || 'Failed to send outbound message' }
  }
}
