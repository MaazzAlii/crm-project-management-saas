'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db'
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

    const channel = await queryOne<any>(
      `SELECT id, organization_id, external_account_id, channel_name, status, connected_at, metadata
       FROM communication_channels
       WHERE organization_id = $1 AND provider = 'slack'`,
      [session.organization.id]
    )

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
        signing_secret_masked: maskedSigningSecret,
      },
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

    // Fetch existing channel if any
    const existingChannel = await queryOne<any>(
      `SELECT id, metadata FROM communication_channels WHERE organization_id = $1 AND provider = 'slack'`,
      [session.organization.id]
    )

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
         ) VALUES ($1, 'slack', $2, $3, 'active', NOW(), $4)`,
        [session.organization.id, externalAccountId, channelName, JSON.stringify(metadataPayload)]
      )
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

    await query(
      `UPDATE communication_channels
       SET status = 'disconnected', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [channelId, session.organization.id]
    )

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

    const channel = await queryOne<any>(
      `SELECT id, external_account_id, metadata
       FROM communication_channels
       WHERE id = $1 AND organization_id = $2`,
      [channelId, session.organization.id]
    )

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
