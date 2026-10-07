'use server'

import { revalidatePath } from 'next/cache'
import { query, queryOne } from '@/lib/db'
import { requirePortalSession } from '@/lib/portal/auth'
import { logAuditEvent } from '@/lib/audit/logger'
import type { ClientPortalSettings } from '@/lib/portal/settings'

export interface UpdateProfileInput {
  name: string
  company?: string
  email?: string
  phone?: string
  country?: string
  logoUrl?: string
}

export interface UpdateBillingInput {
  billingEmail: string
  taxId?: string
  preferredMethod: string
  requirePo: boolean
  autoReceipt: boolean
  currency?: string
}

export interface UpdateNotificationsInput {
  newProject: boolean
  deadlineAlerts: boolean
  deliverableReady: boolean
  invoiceIssued: boolean
}

export async function updatePortalProfileAction(input: UpdateProfileInput) {
  try {
    const { clientId, organizationId, clientUser } = await requirePortalSession()

    // Validation
    const name = input.name?.trim()
    if (!name || name.length < 2) {
      return { success: false, error: 'Contact / Organization name is required (minimum 2 characters).' }
    }

    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      return { success: false, error: 'Please provide a valid email address.' }
    }

    // Fetch existing settings to preserve nested preferences
    const currentClient = await queryOne<{ portal_settings: any }>(
      'SELECT portal_settings FROM clients WHERE id = $1',
      [clientId]
    )

    const currentSettings: ClientPortalSettings = currentClient?.portal_settings || {
      invoicing_preferences: { require_po: false, auto_receipt: true, preferred_method: 'stripe_card' },
      notifications: { new_project: true, deadline_alerts: true, deliverable_ready: true, invoice_issued: true },
    }

    const updatedSettings = {
      ...currentSettings,
      logo_url: input.logoUrl?.trim() || currentSettings.logo_url || null,
    }

    await query(
      `UPDATE clients
       SET name = $1,
           company = $2,
           email = $3,
           phone = $4,
           country = $5,
           portal_settings = $6,
           updated_at = NOW()
       WHERE id = $7`,
      [
        name,
        input.company?.trim() || null,
        input.email?.trim() || null,
        input.phone?.trim() || null,
        input.country?.trim() || null,
        JSON.stringify(updatedSettings),
        clientId,
      ]
    )

    try {
      await logAuditEvent({
        actorId: clientUser?.id,
        organizationId,
        action: 'PORTAL_SETTINGS_UPDATED',
        targetType: 'client_portal',
        targetId: clientId,
        details: { type: 'profile', name, email: input.email },
      })
    } catch (e) {}

    revalidatePath('/client/settings')
    revalidatePath('/client/dashboard')

    return { success: true, message: 'Profile information updated successfully.' }
  } catch (err: any) {
    console.error('[Portal:Settings] Error updating profile:', err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

export async function updatePortalBillingAction(input: UpdateBillingInput) {
  try {
    const { clientId, organizationId, clientUser } = await requirePortalSession()

    if (!input.billingEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.billingEmail.trim())) {
      return { success: false, error: 'A valid billing contact email address is required.' }
    }

    const currentClient = await queryOne<{ portal_settings: any; currency: string }>(
      'SELECT portal_settings, currency FROM clients WHERE id = $1',
      [clientId]
    )

    const currentSettings: ClientPortalSettings = currentClient?.portal_settings || {
      invoicing_preferences: { require_po: false, auto_receipt: true, preferred_method: 'stripe_card' },
      notifications: { new_project: true, deadline_alerts: true, deliverable_ready: true, invoice_issued: true },
    }

    const updatedSettings: ClientPortalSettings = {
      ...currentSettings,
      billing_email: input.billingEmail.trim(),
      tax_id: input.taxId?.trim() || null,
      invoicing_preferences: {
        require_po: !!input.requirePo,
        auto_receipt: !!input.autoReceipt,
        preferred_method: input.preferredMethod || 'stripe_card',
      },
    }

    if (input.currency) {
      await query(
        `UPDATE clients
         SET portal_settings = $1, currency = $2, updated_at = NOW()
         WHERE id = $3`,
        [JSON.stringify(updatedSettings), input.currency, clientId]
      )
    } else {
      await query(
        `UPDATE clients
         SET portal_settings = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(updatedSettings), clientId]
      )
    }

    try {
      await logAuditEvent({
        actorId: clientUser?.id,
        organizationId,
        action: 'PORTAL_SETTINGS_UPDATED',
        targetType: 'client_portal',
        targetId: clientId,
        details: { type: 'billing', billingEmail: input.billingEmail },
      })
    } catch (e) {}

    revalidatePath('/client/settings')
    revalidatePath('/client/invoices')

    return { success: true, message: 'Billing & Invoicing preferences saved.' }
  } catch (err: any) {
    console.error('[Portal:Settings] Error updating billing:', err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

export async function updatePortalNotificationsAction(input: UpdateNotificationsInput) {
  try {
    const { clientId, organizationId, clientUser } = await requirePortalSession()

    const currentClient = await queryOne<{ portal_settings: any }>(
      'SELECT portal_settings FROM clients WHERE id = $1',
      [clientId]
    )

    const currentSettings: ClientPortalSettings = currentClient?.portal_settings || {
      invoicing_preferences: { require_po: false, auto_receipt: true, preferred_method: 'stripe_card' },
      notifications: { new_project: true, deadline_alerts: true, deliverable_ready: true, invoice_issued: true },
    }

    const updatedSettings: ClientPortalSettings = {
      ...currentSettings,
      notifications: {
        new_project: !!input.newProject,
        deadline_alerts: !!input.deadlineAlerts,
        deliverable_ready: !!input.deliverableReady,
        invoice_issued: !!input.invoiceIssued,
      },
    }

    await query(
      `UPDATE clients
       SET portal_settings = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(updatedSettings), clientId]
    )

    try {
      await logAuditEvent({
        actorId: clientUser?.id,
        organizationId,
        action: 'PORTAL_SETTINGS_UPDATED',
        targetType: 'client_portal',
        targetId: clientId,
        details: { type: 'notifications' },
      })
    } catch (e) {}

    revalidatePath('/client/settings')

    return { success: true, message: 'Notification preferences updated.' }
  } catch (err: any) {
    console.error('[Portal:Settings] Error updating notifications:', err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}
