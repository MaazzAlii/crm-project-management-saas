import { createClient } from '@/lib/supabase/server'
import { requirePortalSession } from '@/lib/portal/auth'

export interface ClientPortalSettings {
  logo_url?: string | null
  billing_email?: string | null
  tax_id?: string | null
  invoicing_preferences: {
    require_po: boolean
    auto_receipt: boolean
    preferred_method: string
  }
  notifications: {
    new_project: boolean
    deadline_alerts: boolean
    deliverable_ready: boolean
    invoice_issued: boolean
  }
}

export interface ClientPortalTeamMember {
  id: string
  userId: string
  email: string
  invitedAt: string | null
  lastLoginAt: string | null
  isActive: boolean
}

export interface ClientPortalIntegrationChannel {
  id: string
  channelType: string
  channelName: string
  isActive: boolean
  lastSyncedAt: string | null
}

export interface ClientPortalFullSettingsData {
  client: {
    id: string
    name: string
    company: string | null
    email: string | null
    phone: string | null
    country: string | null
    currency: string
    paymentSchedule: string
    platform: string
    settings: ClientPortalSettings
  }
  teamMembers: ClientPortalTeamMember[]
  channels: ClientPortalIntegrationChannel[]
  organization: {
    name: string
    logoUrl?: string | null
  }
}

export async function fetchClientPortalSettingsData(): Promise<ClientPortalFullSettingsData> {
  const { clientId, organizationId } = await requirePortalSession()
  const supabase = await createClient()

  // 1. Fetch Client Record
  const { data: clientData, error: clientErr } = await supabase
    .from('clients')
    .select('id, name, company, email, phone, country, currency, payment_schedule, platform, portal_settings')
    .eq('id', clientId)
    .single()

  if (clientErr || !clientData) {
    throw new Error('Client profile not found.')
  }

  // 2. Fetch Organization Details
  const { data: orgData } = await supabase
    .from('organizations')
    .select('name, logo_url')
    .eq('id', organizationId)
    .single()

  // 3. Fetch Client Users (Team)
  const { data: clientUsers } = await supabase
    .from('client_users')
    .select('id, user_id, invited_at, last_login_at, is_active')
    .eq('client_id', clientId)

  // 4. Fetch Active Communication Channels for Org
  const { data: orgChannels } = await supabase
    .from('communication_channels')
    .select('id, channel_type, channel_name, is_active, updated_at')
    .eq('organization_id', organizationId)
    .eq('is_active', true)

  const defaultSettings: ClientPortalSettings = {
    logo_url: null,
    billing_email: clientData.email || '',
    tax_id: '',
    invoicing_preferences: {
      require_po: false,
      auto_receipt: true,
      preferred_method: 'stripe_card',
    },
    notifications: {
      new_project: true,
      deadline_alerts: true,
      deliverable_ready: true,
      invoice_issued: true,
    },
  }

  const rawSettings = clientData.portal_settings as Partial<ClientPortalSettings> | null
  const mergedSettings: ClientPortalSettings = {
    ...defaultSettings,
    ...rawSettings,
    invoicing_preferences: {
      ...defaultSettings.invoicing_preferences,
      ...(rawSettings?.invoicing_preferences || {}),
    },
    notifications: {
      ...defaultSettings.notifications,
      ...(rawSettings?.notifications || {}),
    },
  }

  const teamMembers: ClientPortalTeamMember[] = (clientUsers || []).map((cu) => ({
    id: cu.id,
    userId: cu.user_id,
    email: clientData.email || 'Client User',
    invitedAt: cu.invited_at,
    lastLoginAt: cu.last_login_at,
    isActive: cu.is_active,
  }))

  const channels: ClientPortalIntegrationChannel[] = (orgChannels || []).map((ch) => ({
    id: ch.id,
    channelType: ch.channel_type,
    channelName: ch.channel_name || ch.channel_type,
    isActive: ch.is_active,
    lastSyncedAt: ch.updated_at,
  }))

  return {
    client: {
      id: clientData.id,
      name: clientData.name,
      company: clientData.company,
      email: clientData.email,
      phone: clientData.phone,
      country: clientData.country,
      currency: clientData.currency || 'USD',
      paymentSchedule: clientData.payment_schedule || 'Per Project',
      platform: clientData.platform || 'WhatsApp',
      settings: mergedSettings,
    },
    teamMembers,
    channels,
    organization: {
      name: orgData?.name || 'Agency Hub',
      logoUrl: orgData?.logo_url,
    },
  }
}
