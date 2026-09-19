'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePortalSession } from '@/lib/portal/auth'
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
    const { clientId } = await requirePortalSession()
    const supabase = await createClient()

    // Validation
    const name = input.name?.trim()
    if (!name || name.length < 2) {
      return { success: false, error: 'Contact / Organization name is required (minimum 2 characters).' }
    }

    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      return { success: false, error: 'Please provide a valid email address.' }
    }

    // Fetch existing settings to preserve nested preferences
    const { data: currentClient } = await supabase
      .from('clients')
      .select('portal_settings')
      .eq('id', clientId)
      .single()

    const currentSettings: ClientPortalSettings = currentClient?.portal_settings || {
      invoicing_preferences: { require_po: false, auto_receipt: true, preferred_method: 'stripe_card' },
      notifications: { new_project: true, deadline_alerts: true, deliverable_ready: true, invoice_issued: true },
    }

    const updatedSettings = {
      ...currentSettings,
      logo_url: input.logoUrl?.trim() || currentSettings.logo_url || null,
    }

    const { error } = await supabase
      .from('clients')
      .update({
        name,
        company: input.company?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        country: input.country?.trim() || null,
        portal_settings: updatedSettings,
      })
      .eq('id', clientId)

    if (error) {
      console.error('[Portal:Settings] Profile update failed:', error)
      return { success: false, error: 'Failed to update profile. Please try again.' }
    }

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
    const { clientId } = await requirePortalSession()
    const supabase = await createClient()

    if (!input.billingEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.billingEmail.trim())) {
      return { success: false, error: 'A valid billing contact email address is required.' }
    }

    // Fetch current settings to merge
    const { data: currentClient } = await supabase
      .from('clients')
      .select('portal_settings, currency')
      .eq('id', clientId)
      .single()

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

    const updatePayload: any = {
      portal_settings: updatedSettings,
    }

    if (input.currency) {
      updatePayload.currency = input.currency
    }

    const { error } = await supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', clientId)

    if (error) {
      console.error('[Portal:Settings] Billing update failed:', error)
      return { success: false, error: 'Failed to save billing preferences.' }
    }

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
    const { clientId } = await requirePortalSession()
    const supabase = await createClient()

    const { data: currentClient } = await supabase
      .from('clients')
      .select('portal_settings')
      .eq('id', clientId)
      .single()

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

    const { error } = await supabase
      .from('clients')
      .update({ portal_settings: updatedSettings })
      .eq('id', clientId)

    if (error) {
      console.error('[Portal:Settings] Notification preferences update failed:', error)
      return { success: false, error: 'Failed to update alert preferences.' }
    }

    revalidatePath('/client/settings')

    return { success: true, message: 'Notification preferences updated.' }
  } catch (err: any) {
    console.error('[Portal:Settings] Error updating notifications:', err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}
