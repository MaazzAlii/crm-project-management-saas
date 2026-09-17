'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()

    const { data: channel, error } = await supabase
      .from('communication_channels')
      .select('id, organization_id, external_account_id, channel_name, status, connected_at, metadata')
      .eq('organization_id', session.organization.id)
      .eq('provider', 'whatsapp')
      .maybeSingle()

    if (error) {
      return { channel: null, error: error.message }
    }

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
        auth_token_masked: maskedAuthToken
      }
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
    const supabase = await createClient()

    // Fetch existing channel if any
    const { data: existingChannel } = await supabase
      .from('communication_channels')
      .select('id, metadata')
      .eq('organization_id', session.organization.id)
      .eq('provider', 'whatsapp')
      .maybeSingle()

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
      updated_by_user_id: session.user.id
    }

    if (existingChannel) {
      const { error: updateError } = await supabase
        .from('communication_channels')
        .update({
          external_account_id: formattedPhone,
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
          provider: 'whatsapp',
          external_account_id: formattedPhone,
          channel_name: channelName,
          status: 'active',
          connected_at: new Date().toISOString(),
          metadata: metadataPayload
        })

      if (insertError) return { error: insertError.message }
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

    const supabase = await createClient()

    const { error } = await supabase
      .from('communication_channels')
      .update({ status: 'disconnected' })
      .eq('id', channelId)
      .eq('organization_id', session.organization.id)

    if (error) return { error: error.message }

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

    const supabase = await createClient()

    const { data: channel } = await supabase
      .from('communication_channels')
      .select('id, external_account_id, metadata')
      .eq('id', channelId)
      .eq('organization_id', session.organization.id)
      .single()

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
