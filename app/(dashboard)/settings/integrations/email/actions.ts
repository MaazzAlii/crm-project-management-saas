'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db'
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

    const channel = await queryOne<any>(
      `SELECT id, organization_id, external_account_id, channel_name, status, connected_at, metadata
       FROM communication_channels
       WHERE organization_id = $1 AND provider = 'email'`,
      [session.organization.id]
    )

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
        inbound_email_address: inboundAddr,
      },
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

    // Fetch existing channel if any
    const existingChannel = await queryOne<any>(
      `SELECT id, metadata FROM communication_channels WHERE organization_id = $1 AND provider = 'email'`,
      [session.organization.id]
    )

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
      updated_by_user_id: session.user.id,
    }

    if (existingChannel) {
      await query(
        `UPDATE communication_channels
         SET external_account_id = $1, channel_name = $2, status = 'active',
             connected_at = NOW(), metadata = $3, updated_at = NOW()
         WHERE id = $4`,
        [externalAccountId, channelName, JSON.stringify(metadataPayload), existingChannel.id]
      )
    } else {
      await query(
        `INSERT INTO communication_channels (
           organization_id, provider, external_account_id, channel_name, status, connected_at, metadata
         ) VALUES ($1, 'email', $2, $3, 'active', NOW(), $4)`,
        [session.organization.id, externalAccountId, channelName, JSON.stringify(metadataPayload)]
      )
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

    await query(
      `UPDATE communication_channels
       SET status = 'disconnected', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [channelId, session.organization.id]
    )

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

    const channel = await queryOne<any>(
      `SELECT id, external_account_id, metadata
       FROM communication_channels
       WHERE id = $1 AND organization_id = $2`,
      [channelId, session.organization.id]
    )

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
