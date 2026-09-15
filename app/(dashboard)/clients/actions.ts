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
    const tagsRaw = formData.get('tags')?.toString().trim()
    let tags: string[] = []
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw)
      } catch (e) {}
    }

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

    let newClient: { id: string } | null = null
    let insertError: any = null

    try {
      const { data, error } = await supabase
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
          tags,
        })
        .select('id')
        .single()

      newClient = data
      insertError = error
    } catch (err: any) {
      insertError = err
    }

    if ((insertError || !newClient) && process.env.DEV_SUPER_ADMIN === 'true') {
      const devClientId = 'dev-client-' + Date.now()
      const devRecord = {
        id: devClientId,
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
        tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      ;(global as any).__DEV_CLIENTS = (global as any).__DEV_CLIENTS || []
      ;(global as any).__DEV_CLIENTS.unshift(devRecord)

      revalidatePath('/clients')
      return { success: true, clientId: devClientId }
    }

    if (insertError || !newClient) {
      console.error('Failed to insert client record:', insertError)
      return { error: insertError?.message || 'Database error occurred while creating client.' }
    }

    // Audit Logging
    try {
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
    } catch (e) {}

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

export async function updateClientAction(clientId: string, formData: FormData) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized session.' }
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
    const tagsRaw = formData.get('tags')?.toString().trim()
    let tags: string[] | undefined = undefined
    if (tagsRaw !== undefined && tagsRaw !== null) {
      try {
        tags = JSON.parse(tagsRaw)
      } catch (e) {}
    }

    if (!name) {
      return { error: 'Client name is required.' }
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { error: 'Invalid email address format.' }
      }
    }

    const supabase = await createClient()

    const updatePayload: any = {
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
      updated_at: new Date().toISOString(),
    }

    if (tags !== undefined) {
      updatePayload.tags = tags
    }

    let updateError: any = null
    try {
      const { error } = await supabase
        .from('clients')
        .update(updatePayload)
        .eq('id', clientId)
        .eq('organization_id', session.organization.id)

      updateError = error
    } catch (err) {
      updateError = err
    }

    if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS) {
      const idx = (global as any).__DEV_CLIENTS.findIndex((c: any) => c.id === clientId)
      if (idx !== -1) {
        ;(global as any).__DEV_CLIENTS[idx] = {
          ...(global as any).__DEV_CLIENTS[idx],
          ...updatePayload,
        }
      }
    }

    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'CLIENT_UPDATED',
        targetType: 'client',
        targetId: clientId,
        details: {
          name,
          communication_mode,
          organizationId: session.organization.id,
        },
      })
    } catch (e) {}

    revalidatePath('/clients')
    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  } catch (error: any) {
    console.error('updateClientAction error:', error)
    return { error: error?.message || 'Internal server error.' }
  }
}

export async function updateClientNotesAction(clientId: string, notes: string) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized session.' }
    }

    const supabase = await createClient()

    try {
      await supabase
        .from('clients')
        .update({
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId)
        .eq('organization_id', session.organization.id)
    } catch (e) {}

    if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS) {
      const idx = (global as any).__DEV_CLIENTS.findIndex((c: any) => c.id === clientId)
      if (idx !== -1) {
        ;(global as any).__DEV_CLIENTS[idx].notes = notes
        ;(global as any).__DEV_CLIENTS[idx].updated_at = new Date().toISOString()
      }
    }

    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error?.message || 'Failed to update notes.' }
  }
}
