'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { checkClientLimit } from '@/lib/billing/plan-limits'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'

export async function createClientAction(formData: FormData) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized. Active session context not found.' }
    }

    const name = formData.get('name')?.toString().trim()
    const company = formData.get('company')?.toString().trim() || null
    const email = formData.get('email')?.toString().trim() || null
    const phone = formData.get('phone')?.toString().trim() || null
    const platform = formData.get('platform')?.toString().trim() || 'WhatsApp'
    const country = formData.get('country')?.toString().trim() || null
    const currency = formData.get('currency')?.toString().trim() || 'USD'
    const payment_schedule = formData.get('payment_schedule')?.toString().trim() || 'Per Project'
    const status = formData.get('status')?.toString().trim() || 'active'
    const communication_mode = (formData.get('communication_mode')?.toString().trim() || 'manual') as 'manual' | 'connected'
    const notes = formData.get('notes')?.toString().trim() || null

    if (!name) {
      return { error: 'Client name is required.' }
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { error: 'Invalid email address format.' }
      }
    }

    // Server-side Plan Limit Check (CRITICAL SECURITY & BILLING REQUIREMENT)
    const limitCheck = await checkClientLimit(session.organization.id)
    if (!limitCheck.allowed) {
      return {
        error: `You've reached your plan's client limit (${limitCheck.maxLimit} clients). Please upgrade your plan to add more clients.`,
      }
    }

    const supabase = await createClient()

    const { data: newClient, error: insertError } = await supabase
      .from('clients')
      .insert({
        organization_id: session.organization.id,
        name,
        company,
        email,
        phone,
        platform,
        country,
        currency,
        payment_schedule,
        status,
        communication_mode,
        notes,
      })
      .select('id')
      .single()

    if (insertError || !newClient) {
      console.error('Failed to insert client record:', insertError)
      return { error: insertError?.message || 'Database error occurred while creating client.' }
    }

    // Audit Logging
    await logAuditEvent({
      actorId: session.user.id,
      action: 'CLIENT_CREATED',
      targetType: 'client',
      targetId: newClient.id,
      details: {
        name,
        communication_mode,
        platform,
        organizationId: session.organization.id,
      },
    })

    revalidatePath('/clients')
    return { success: true, clientId: newClient.id }
  } catch (error: any) {
    console.error('createClientAction error:', error)
    return { error: error?.message || 'Internal server error occurred.' }
  }
}

export async function deleteClientAction(clientId: string) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized session.' }
    }

    const canDelete =
      session.role === 'owner' || session.role === 'admin' || session.isSuperAdmin

    if (!canDelete) {
      return { error: 'Forbidden. Only organization owners and admins can delete clients.' }
    }

    const supabase = await createClient()

    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('organization_id', session.organization.id)

    if (deleteError) {
      console.error('Failed to delete client:', deleteError)
      return { error: deleteError.message }
    }

    await logAuditEvent({
      actorId: session.user.id,
      action: 'CLIENT_DELETED',
      targetType: 'client',
      targetId: clientId,
      details: {
        organizationId: session.organization.id,
      },
    })

    revalidatePath('/clients')
    return { success: true }
  } catch (error: any) {
    console.error('deleteClientAction error:', error)
    return { error: error?.message || 'Internal server error.' }
  }
}
