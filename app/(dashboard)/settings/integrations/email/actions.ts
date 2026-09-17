'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { encryptSecret, decryptSecret } from '@/lib/security/encrypt'
import { sendEmailOutboundMessage } from '@/lib/providers/email'
import { revalidatePath } from 'next/cache'

export interface EmailChannelConfig {
  id?: string
  organization_id?: string
  external_account_id: string // e.g. "support@agency.com"
  channel_name: string
  status: 'active' | 'disconnected' | 'error'
  sendgrid_api_key_masked?: string
  smtp_host?: string
  smtp_port?: string
  connected_at?: string
  inbound_email_address?: string
}

export async function getEmailIntegrationStatusAction(): Promise<{
  channel: EmailChannelConfig | null
  error?: string
}> {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { channel: null, error: 'Unauthorized session' }
    }

    const supabase = await createClient()

    const { data: channel, error } = await supabase
      .from('communication_channels')
      .select('id, organization_id, external_account_id, channel_name, status, connected_at, metadata')
      .eq('organization_id', session.organization.id)
      .eq('provider', 'email')
      .maybeSingle()

    if (error) {
      return { channel: null, error: error.message }
    }

    if (!channel) {
      return { channel: null }
    }

    const meta = (channel.metadata as Record<string, any>) || {}
    const rawApiKey = meta.sendgrid_api_key ? decryptSecret(meta.sendgrid_api_key) : ''
    const maskedKey = rawApiKey ? `${rawApiKey.slice(0, 4)}...${rawApiKey.slice(-4)}` : ''
    const inboundAddr = meta.inbound_email || `inbox-${session.organization.id.slice(0, 8)}@inbound.crm-platform.com`

    return {
      channel: {
        id: channel.id,
        organization_id: channel.organization_id,
        external_account_id: channel.external_account_id,
        channel_name: channel.channel_name || 'Support Email (support@agency.com)',
        status: channel.status as any,
        connected_at: channel.connected_at,
        sendgrid_api_key_masked: maskedKey,
        smtp_host: meta.smtp_host || '',
        smtp_port: meta.smtp_port || '587',
        inbound_email_address: inboundAddr
      }
    }
  } catch (err: any) {
    return { channel: null, error: err.message || 'Failed to load Email integration status' }
  }
}

export async function saveEmailIntegrationAction(formData: FormData) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { error: 'Unauthorized' }
    }

    const channelName = formData.get('channel_name')?.toString().trim() || 'Support Email'
    const externalAccountId = formData.get('external_account_id')?.toString().trim().toLowerCase()
    const sendgridApiKey = formData.get('sendgrid_api_key')?.toString().trim()
    const smtpHost = formData.get('smtp_host')?.toString().trim()
    const smtpPort = formData.get('smtp_port')?.toString().trim()

    if (!externalAccountId || !externalAccountId.includes('@')) {
      return { error: 'Valid support email address is required (e.g. support@agency.com)' }
    }

    const supabase = await createClient()

    // Fetch existing channel if any
    const { data: existingChannel } = await supabase
      .from('communication_channels')
      .select('id, metadata')
      .eq('organization_id', session.organization.id)
      .eq('provider', 'email')
      .maybeSingle()

    const existingMeta = (existingChannel?.metadata as Record<string, any>) || {}

    // Encrypt API key if provided, else retain existing encrypted secret
    const encryptedKey = sendgridApiKey
      ? encryptSecret(sendgridApiKey)
      : existingMeta.sendgrid_api_key || ''

    const inboundAddr = `inbox-${session.organization.id.slice(0, 8)}@inbound.crm-platform.com`

    const metadataPayload = {
      ...existingMeta,
      sendgrid_api_key: encryptedKey,
      smtp_host: smtpHost || existingMeta.smtp_host || '',
      smtp_port: smtpPort || existingMeta.smtp_port || '587',
      inbound_email: inboundAddr,
      sender_email: externalAccountId,
      updated_by_user_id: session.user.id
    }

    if (existingChannel) {
      const { error: updateError } = await supabase
        .from('communication_channels')
        .update({
          external_account_id: externalAccountId,
          channel_name: channelName,
          status: 'active',
          connected_at: new Date().toISOString(),
          metadata: metadataPayload
        })
        .eq('id', existingChannel.id)

      if (updateError) return { error: updateError.message }
    } else {
      const { error: insertError } = await supabase
        .from('communication_channels')
        .insert({
          organization_id: session.organization.id,
          provider: 'email',
          external_account_id: externalAccountId,
          channel_name: channelName,
          status: 'active',
          connected_at: new Date().toISOString(),
          metadata: metadataPayload
        })

      if (insertError) return { error: insertError.message }
    }

    revalidatePath('/settings/integrations')
    revalidatePath('/settings/integrations/email')
    revalidatePath('/inbox')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to save Email integration' }
  }
}

export async function disconnectEmailIntegrationAction(channelId: string) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('communication_channels')
      .update({ status: 'disconnected' })
      .eq('id', channelId)
      .eq('organization_id', session.organization.id)

    if (error) return { error: error.message }

    revalidatePath('/settings/integrations')
    revalidatePath('/settings/integrations/email')
    revalidatePath('/inbox')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to disconnect Email channel' }
  }
}

export async function testEmailConnectionAction(channelId: string, testRecipientEmail?: string) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { data: channel } = await supabase
      .from('communication_channels')
      .select('id, external_account_id, metadata')
      .eq('id', channelId)
      .eq('organization_id', session.organization.id)
      .single()

    if (!channel) {
      return { error: 'Email Channel not found' }
    }

    const meta = (channel.metadata as Record<string, any>) || {}
    const sendgridApiKey = meta.sendgrid_api_key ? decryptSecret(meta.sendgrid_api_key) : ''
    const fromEmail = channel.external_account_id
    const recipientEmail = testRecipientEmail || fromEmail

    if (!sendgridApiKey) {
      return { error: 'SendGrid API Key is missing or unconfigured.' }
    }

    const testRes = await sendEmailOutboundMessage(
      sendgridApiKey,
      fromEmail,
      session.organization.name || 'Agency Support',
      recipientEmail,
      'CRM Communication Hub Test Signal',
      `Hello!\n\nThis is a test signal sent from your CRM Unified Inbox via SendGrid to verify email channel dispatch integration.\n\nTime: ${new Date().toLocaleTimeString()}\nUser: ${session.user.full_name || session.user.email}`
    )

    if (!testRes.ok) {
      return { error: `Email Test Dispatch Failed: ${testRes.error}` }
    }

    return { success: true, message: `Test email signal sent to ${recipientEmail} successfully!` }
  } catch (err: any) {
    return { error: err.message || 'Failed to dispatch test email message' }
  }
}
