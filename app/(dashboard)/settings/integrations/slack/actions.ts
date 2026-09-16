'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { encryptSecret, decryptSecret } from '@/lib/security/encrypt'
import { sendSlackOutboundMessage } from '@/lib/providers/slack'
import { revalidatePath } from 'next/cache'

export interface SlackChannelConfig {
  id?: string
  organization_id?: string
  external_account_id: string
  channel_name: string
  status: 'active' | 'disconnected' | 'error'
  bot_access_token_masked?: string
  signing_secret_masked?: string
  connected_at?: string
}

export async function getSlackIntegrationStatusAction(): Promise<{
  channel: SlackChannelConfig | null
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
      .eq('provider', 'slack')
      .maybeSingle()

    if (error) {
      return { channel: null, error: error.message }
    }

    if (!channel) {
      return { channel: null }
    }

    const meta = (channel.metadata as Record<string, any>) || {}
    const rawBotToken = meta.bot_access_token ? decryptSecret(meta.bot_access_token) : ''
    const rawSigningSecret = meta.signing_secret ? decryptSecret(meta.signing_secret) : ''

    const maskedBotToken = rawBotToken ? `${rawBotToken.slice(0, 9)}...${rawBotToken.slice(-4)}` : ''
    const maskedSigningSecret = rawSigningSecret ? `${rawSigningSecret.slice(0, 4)}...${rawSigningSecret.slice(-3)}` : ''

    return {
      channel: {
        id: channel.id,
        organization_id: channel.organization_id,
        external_account_id: channel.external_account_id,
        channel_name: channel.channel_name || '#general',
        status: channel.status as any,
        connected_at: channel.connected_at,
        bot_access_token_masked: maskedBotToken,
        signing_secret_masked: maskedSigningSecret
      }
    }
  } catch (err: any) {
    return { channel: null, error: err.message || 'Failed to load Slack status' }
  }
}

export async function saveSlackIntegrationAction(formData: FormData) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { error: 'Unauthorized' }
    }

    const channelName = formData.get('channel_name')?.toString().trim() || '#general'
    const externalAccountId = formData.get('external_account_id')?.toString().trim()
    const botToken = formData.get('bot_access_token')?.toString().trim()
    const signingSecret = formData.get('signing_secret')?.toString().trim()

    if (!externalAccountId) {
      return { error: 'Slack Workspace or Channel ID is required (e.g. C01234567 or T01234567)' }
    }

    const supabase = await createClient()

    // Fetch existing channel if any
    const { data: existingChannel } = await supabase
      .from('communication_channels')
      .select('id, metadata')
      .eq('organization_id', session.organization.id)
      .eq('provider', 'slack')
      .maybeSingle()

    const existingMeta = (existingChannel?.metadata as Record<string, any>) || {}

    // Encrypt secrets if provided, else retain previous encrypted tokens
    const encryptedBotToken = botToken
      ? encryptSecret(botToken)
      : existingMeta.bot_access_token || ''
    const encryptedSigningSecret = signingSecret
      ? encryptSecret(signingSecret)
      : existingMeta.signing_secret || ''

    const metadataPayload = {
      ...existingMeta,
      bot_access_token: encryptedBotToken,
      signing_secret: encryptedSigningSecret,
      slack_channel_id: externalAccountId,
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
          provider: 'slack',
          external_account_id: externalAccountId,
          channel_name: channelName,
          status: 'active',
          connected_at: new Date().toISOString(),
          metadata: metadataPayload
        })

      if (insertError) return { error: insertError.message }
    }

    revalidatePath('/settings/integrations')
    revalidatePath('/settings/integrations/slack')
    revalidatePath('/inbox')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to save Slack channel integration' }
  }
}

export async function disconnectSlackIntegrationAction(channelId: string) {
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
    revalidatePath('/settings/integrations/slack')
    revalidatePath('/inbox')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to disconnect Slack channel' }
  }
}

export async function testSlackConnectionAction(channelId: string) {
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
      return { error: 'Channel not found' }
    }

    const meta = (channel.metadata as Record<string, any>) || {}
    const rawBotToken = meta.bot_access_token ? decryptSecret(meta.bot_access_token) : ''
    const slackChannelId = meta.slack_channel_id || channel.external_account_id

    if (!rawBotToken) {
      return { error: 'Slack Bot Access Token is missing or not configured.' }
    }

    const testRes = await sendSlackOutboundMessage(
      rawBotToken,
      slackChannelId,
      `🔌 *CRM Communication Hub Connected*: Test signal sent successfully by ${session.user.full_name || session.user.email} at ${new Date().toLocaleTimeString()}.`
    )

    if (!testRes.ok) {
      return { error: `Slack Test Dispatch Failed: ${testRes.error}` }
    }

    return { success: true, message: 'Test message sent to Slack successfully!' }
  } catch (err: any) {
    return { error: err.message || 'Failed to dispatch test message' }
  }
}
