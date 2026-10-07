import { query, queryOne } from '@/lib/db'
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

  // 1. Fetch Client Record
  const clientData = await queryOne<{
    id: string
    name: string
    company: string | null
    email: string | null
    phone: string | null
    country: string | null
    currency: string | null
    payment_schedule: string | null
    platform: string | null
    portal_settings: any
  }>(
    'SELECT id, name, company, email, phone, country, currency, payment_schedule, platform, portal_settings FROM clients WHERE id = $1',
    [clientId]
  )

  if (!clientData) {
    throw new Error('Client profile not found.')
  }

  // 2. Fetch Organization Details
  const orgData = await queryOne<{
    name: string
    logo_url: string | null
  }>(
    'SELECT name, logo_url FROM organizations WHERE id = $1',
    [organizationId]
  )

  // 3. Fetch Client Users (Team)
  const clientUsersRes = await query<{
    id: string
    user_id: string
    invited_at: string | null
    last_login_at: string | null
    is_active: boolean
  }>(
    'SELECT id, user_id, invited_at, last_login_at, is_active FROM client_users WHERE client_id = $1',
    [clientId]
  )
  const clientUsers = clientUsersRes.rows

  // 4. Fetch Active Communication Channels for Org
  const channelsRes = await query<{
    id: string
    channel_type: string
    channel_name: string | null
    is_active: boolean
    updated_at: string | null
  }>(
    'SELECT id, channel_type, channel_name, is_active, updated_at FROM communication_channels WHERE organization_id = $1 AND is_active = true',
    [organizationId]
  )
  const orgChannels = channelsRes.rows

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
