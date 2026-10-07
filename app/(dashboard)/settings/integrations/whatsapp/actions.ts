'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db'
import { encryptSecret, decryptSecret } from '@/lib/security/encrypt'
import { sendWhatsAppOutboundMessage, formatE164Phone } from '@/lib/providers/whatsapp'
import { revalidatePath } from 'next/cache'

export interface WhatsAppChannelConfig {
  id?: string
  organization_id?: string
  external_account_id: string // WhatsApp Phone Number e.g., "+15550192831"
  channel_name: string
  status: 'active' | 'disconnected' | 'error'
  account_sid_masked?: string
  auth_token_masked?: string
  connected_at?: string
}

export async function getWhatsAppIntegrationStatusAction(): Promise<{
  channel: WhatsAppChannelConfig | null
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
       WHERE organization_id = $1 AND provider = 'whatsapp'`,
      [session.organization.id]
    )

    if (!channel) {
      return { channel: null }
    }

    const meta = (channel.metadata as Record<string, any>) || {}
    const rawAccountSid = meta.account_sid ? decryptSecret(meta.account_sid) : ''
    const rawAuthToken = meta.auth_token ? decryptSecret(meta.auth_token) : ''

    const maskedSid = rawAccountSid ? `${rawAccountSid.slice(0, 6)}...${rawAccountSid.slice(-4)}` : ''
    const maskedAuthToken = rawAuthToken ? `${rawAuthToken.slice(0, 4)}...${rawAuthToken.slice(-3)}` : ''

    return {
      channel: {
        id: channel.id,
        organization_id: channel.organization_id,
        external_account_id: channel.external_account_id,
        channel_name: channel.channel_name || 'WhatsApp Business',
        status: channel.status as any,
        connected_at: channel.connected_at,
        account_sid_masked: maskedSid,
        auth_token_masked: maskedAuthToken,
      },
    }
  } catch (err: any) {
    return { channel: null, error: err.message || 'Failed to load WhatsApp status' }
  }
}

export async function saveWhatsAppIntegrationAction(formData: FormData) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { error: 'Unauthorized' }
    }

    const channelName = formData.get('channel_name')?.toString().trim() || 'WhatsApp Business'
    const rawPhone = formData.get('external_account_id')?.toString().trim()
    const accountSid = formData.get('account_sid')?.toString().trim()
    const authToken = formData.get('auth_token')?.toString().trim()

    if (!rawPhone) {
      return { error: 'WhatsApp Phone Number is required (e.g. +15550192831)' }
    }

    const formattedPhone = formatE164Phone(rawPhone)

    // Fetch existing channel if any
    const existingChannel = await queryOne<any>(
      `SELECT id, metadata FROM communication_channels WHERE organization_id = $1 AND provider = 'whatsapp'`,
      [session.organization.id]
    )

    const existingMeta = (existingChannel?.metadata as Record<string, any>) || {}

    // Encrypt secrets if provided, else retain existing
    const encryptedSid = accountSid
      ? encryptSecret(accountSid)
      : existingMeta.account_sid || ''
    const encryptedAuthToken = authToken
      ? encryptSecret(authToken)
      : existingMeta.auth_token || ''

    const metadataPayload = {
      ...existingMeta,
      account_sid: encryptedSid,
      auth_token: encryptedAuthToken,
      phone_number: formattedPhone,
      updated_by_user_id: session.user.id,
    }

    if (existingChannel) {
      await query(
        `UPDATE communication_channels
         SET external_account_id = $1, channel_name = $2, status = 'active',
             connected_at = NOW(), metadata = $3, updated_at = NOW()
         WHERE id = $4`,
        [formattedPhone, channelName, JSON.stringify(metadataPayload), existingChannel.id]
      )
    } else {
      await query(
        `INSERT INTO communication_channels (
           organization_id, provider, external_account_id, channel_name, status, connected_at, metadata
         ) VALUES ($1, 'whatsapp', $2, $3, 'active', NOW(), $4)`,
        [session.organization.id, formattedPhone, channelName, JSON.stringify(metadataPayload)]
      )
    }

    revalidatePath('/settings/integrations')
    revalidatePath('/settings/integrations/whatsapp')
    revalidatePath('/inbox')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to save WhatsApp channel integration' }
  }
}

export async function disconnectWhatsAppIntegrationAction(channelId: string) {
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
    revalidatePath('/settings/integrations/whatsapp')
    revalidatePath('/inbox')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to disconnect WhatsApp channel' }
  }
}

export async function testWhatsAppConnectionAction(channelId: string, testRecipientPhone?: string) {
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
      return { error: 'WhatsApp Channel not found' }
    }

    const meta = (channel.metadata as Record<string, any>) || {}
    const accountSid = meta.account_sid ? decryptSecret(meta.account_sid) : ''
    const authToken = meta.auth_token ? decryptSecret(meta.auth_token) : ''
    const fromPhone = meta.phone_number || channel.external_account_id
    const recipientPhone = testRecipientPhone ? formatE164Phone(testRecipientPhone) : fromPhone

    if (!accountSid || !authToken) {
      return { error: 'Twilio Account SID or Auth Token is missing/unconfigured.' }
    }

    const testRes = await sendWhatsAppOutboundMessage(
      accountSid,
      authToken,
      fromPhone,
      recipientPhone,
      `💬 CRM Communication Hub Connected: WhatsApp signal test sent by ${session.user.full_name || session.user.email} at ${new Date().toLocaleTimeString()}.`
    )

    if (!testRes.ok) {
      return { error: `WhatsApp Test Dispatch Failed: ${testRes.error}` }
    }

    return { success: true, message: `Test message sent via WhatsApp to ${recipientPhone} successfully!` }
  } catch (err: any) {
    return { error: err.message || 'Failed to dispatch WhatsApp test message' }
  }
}
