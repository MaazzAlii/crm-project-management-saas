'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { encryptSecret, decryptSecret } from '@/lib/security/encrypt'
import { sendUpworkOutboundMessage } from '@/lib/providers/upwork'
import { revalidatePath } from 'next/cache'

export interface UpworkChannelConfig {
  id?: string
  organization_id?: string
  external_account_id: string // Upwork Contract ID or Room ID
  channel_name: string
  status: 'active' | 'disconnected' | 'error'
  api_key_masked?: string
  contract_id?: string
  connected_at?: string
}

export async function getUpworkIntegrationStatusAction(): Promise<{
  channel: UpworkChannelConfig | null
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
      .eq('provider', 'upwork')
      .maybeSingle()

    if (error) {
      return { channel: null, error: error.message }
    }

    if (!channel) {
      return { channel: null }
    }

    const meta = (channel.metadata as Record<string, any>) || {}
    const rawApiKey = meta.api_key ? decryptSecret(meta.api_key) : ''
    const maskedApiKey = rawApiKey ? `${rawApiKey.slice(0, 4)}...${rawApiKey.slice(-4)}` : ''

    return {
      channel: {
        id: channel.id,
        organization_id: channel.organization_id,
        external_account_id: channel.external_account_id,
        channel_name: channel.channel_name || 'Upwork Direct Contracts',
        status: channel.status as any,
        connected_at: channel.connected_at,
        api_key_masked: maskedApiKey,
        contract_id: meta.contract_id || channel.external_account_id
      }
    }
  } catch (err: any) {
    return { channel: null, error: err.message || 'Failed to load Upwork status' }
  }
}

export async function saveUpworkIntegrationAction(formData: FormData) {
  try {
    const session = await getCurrentSessionContext()
    if (!session || !session.organization) {
      return { error: 'Unauthorized' }
    }

    const channelName = formData.get('channel_name')?.toString().trim() || 'Upwork Direct Contracts'
    const externalAccountId = formData.get('external_account_id')?.toString().trim()
    const apiKey = formData.get('api_key')?.toString().trim()

    if (!externalAccountId) {
      return { error: 'Upwork Contract ID or Room Identifier is required.' }
    }

    const supabase = await createClient()

    const { data: existingChannel } = await supabase
      .from('communication_channels')
      .select('id, metadata')
      .eq('organization_id', session.organization.id)
      .eq('provider', 'upwork')
      .maybeSingle()

    const existingMeta = (existingChannel?.metadata as Record<string, any>) || {}

    const encryptedKey = apiKey
      ? encryptSecret(apiKey)
      : existingMeta.api_key || ''

    const metadataPayload = {
      ...existingMeta,
      api_key: encryptedKey,
      contract_id: externalAccountId,
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
          provider: 'upwork',
          external_account_id: externalAccountId,
          channel_name: channelName,
          status: 'active',
          connected_at: new Date().toISOString(),
          metadata: metadataPayload
        })

      if (insertError) return { error: insertError.message }
    }

    revalidatePath('/settings/integrations')
    revalidatePath('/settings/integrations/upwork')
    revalidatePath('/inbox')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to save Upwork integration' }
  }
}

export async function disconnectUpworkIntegrationAction(channelId: string) {
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
    revalidatePath('/settings/integrations/upwork')
    revalidatePath('/inbox')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to disconnect Upwork channel' }
  }
}

export async function testUpworkConnectionAction(channelId: string) {
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
      return { error: 'Upwork Channel not found' }
    }

    const meta = (channel.metadata as Record<string, any>) || {}
    const apiKey = meta.api_key ? decryptSecret(meta.api_key) : ''
    const contractId = meta.contract_id || channel.external_account_id

    const testRes = await sendUpworkOutboundMessage(
      apiKey,
      contractId,
      `💼 Upwork Contract Logged: Signal test recorded by ${session.user.full_name || session.user.email} at ${new Date().toLocaleTimeString()}.`
    )

    if (!testRes.ok) {
      return { error: `Upwork Dispatch Failed: ${testRes.error}` }
    }

    return { success: true, message: 'Upwork contract message logged successfully!' }
  } catch (err: any) {
    return { error: err.message || 'Failed to record Upwork test message' }
  }
}
