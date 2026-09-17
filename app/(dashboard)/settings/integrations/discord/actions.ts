'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { encryptSecret, decryptSecret } from '@/lib/security/encrypt'
import { sendDiscordOutboundMessage } from '@/lib/providers/discord'
import { revalidatePath } from 'next/cache'

export interface DiscordChannelConfig {
  id?: string
  organization_id?: string
  external_account_id: string // Discord Channel ID or Guild ID
  channel_name: string
  status: 'active' | 'disconnected' | 'error'
  bot_token_masked?: string
  public_key_masked?: string
  connected_at?: string
}

export async function getDiscordIntegrationStatusAction(): Promise<{
  channel: DiscordChannelConfig | null
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
      .eq('provider', 'discord')
      .maybeSingle()

    if (error) {
      return { channel: null, error: error.message }
    }

    if (!channel) {
      return { channel: null }
    }

    const meta = (channel.metadata as Record<string, any>) || {}
    const rawBotToken = meta.bot_token ? decryptSecret(meta.bot_token) : ''
    const rawPubKey = meta.public_key ? decryptSecret(meta.public_key) : ''

    const maskedToken = rawBotToken ? `${rawBotToken.slice(0, 8)}...${rawBotToken.slice(-4)}` : ''
    const maskedPubKey = rawPubKey ? `${rawPubKey.slice(0, 4)}...${rawPubKey.slice(-4)}` : ''

    return {
      channel: {
        id: channel.id,
        organization_id: channel.organization_id,
        external_account_id: channel.external_account_id,
        channel_name: channel.channel_name || '#client-community',
        status: channel.status as any,
        connected_at: channel.connected_at,
        bot_token_masked: maskedToken,
        public_key_masked: maskedPubKey
      }
    }
  } catch (err: any) {
    return { channel: null, error: err.message || 'Failed to load Discord integration status' }
  }
}

export async function saveDiscordIntegrationAction(formData: FormData) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { error: 'Unauthorized' }
    }

    const channelName = formData.get('channel_name')?.toString().trim() || '#client-community'
    const externalAccountId = formData.get('external_account_id')?.toString().trim()
    const botToken = formData.get('bot_token')?.toString().trim()
    const publicKey = formData.get('public_key')?.toString().trim()

    if (!externalAccountId) {
      return { error: 'Discord Channel ID or Server Guild ID is required.' }
    }

    const supabase = await createClient()

    const { data: existingChannel } = await supabase
      .from('communication_channels')
      .select('id, metadata')
      .eq('organization_id', session.organization.id)
      .eq('provider', 'discord')
      .maybeSingle()

    const existingMeta = (existingChannel?.metadata as Record<string, any>) || {}

    const encryptedToken = botToken
      ? encryptSecret(botToken)
      : existingMeta.bot_token || ''
    const encryptedPubKey = publicKey
      ? encryptSecret(publicKey)
      : existingMeta.public_key || ''

    const metadataPayload = {
      ...existingMeta,
      bot_token: encryptedToken,
      public_key: encryptedPubKey,
      channel_id: externalAccountId,
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
          provider: 'discord',
          external_account_id: externalAccountId,
          channel_name: channelName,
          status: 'active',
          connected_at: new Date().toISOString(),
          metadata: metadataPayload
        })

      if (insertError) return { error: insertError.message }
    }

    revalidatePath('/settings/integrations')
    revalidatePath('/settings/integrations/discord')
    revalidatePath('/inbox')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to save Discord integration' }
  }
}

export async function disconnectDiscordIntegrationAction(channelId: string) {
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
    revalidatePath('/settings/integrations/discord')
    revalidatePath('/inbox')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to disconnect Discord channel' }
  }
}

export async function testDiscordConnectionAction(channelId: string) {
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
      return { error: 'Discord Channel not found' }
    }

    const meta = (channel.metadata as Record<string, any>) || {}
    const botToken = meta.bot_token ? decryptSecret(meta.bot_token) : ''
    const targetChannelId = meta.channel_id || channel.external_account_id

    if (!botToken) {
      return { error: 'Discord Bot Token is missing or unconfigured.' }
    }

    const testRes = await sendDiscordOutboundMessage(
      botToken,
      targetChannelId,
      `🎮 **CRM Unified Inbox Connected**: Discord integration test signal sent by ${session.user.full_name || session.user.email} at ${new Date().toLocaleTimeString()}.`
    )

    if (!testRes.ok) {
      return { error: `Discord Test Dispatch Failed: ${testRes.error}` }
    }

    return { success: true, message: 'Test message sent to Discord successfully!' }
  } catch (err: any) {
    return { error: err.message || 'Failed to dispatch Discord test message' }
  }
}
