'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db'
import { checkClientLimit } from '@/lib/billing/plan-limits'
import { logAuditEvent } from '@/lib/audit/logger'
import { validateAndSanitize } from '@/lib/validation/action-wrapper'
import { CreateClientSchema, UpdateClientSchema } from '@/lib/validation/schemas'
import { revalidatePath } from 'next/cache'

export async function createClientAction(formData: FormData) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized. Active session context not found.' }
    }

    const rawData = {
      name: formData.get('name')?.toString(),
      company: formData.get('company')?.toString() || null,
      email: formData.get('email')?.toString() || null,
      phone: formData.get('phone')?.toString() || null,
      platform: formData.get('platform')?.toString() || 'WhatsApp',
      country: formData.get('country')?.toString() || null,
      currency: formData.get('currency')?.toString() || 'USD',
      payment_schedule: formData.get('payment_schedule')?.toString() || 'Per Project',
      status: formData.get('status')?.toString() || 'active',
      communication_mode: formData.get('communication_mode')?.toString() || 'connected',
      notes: formData.get('notes')?.toString() || null,
    }

    const validation = validateAndSanitize(CreateClientSchema, rawData)
    if (!validation.success) {
      return { error: validation.error }
    }

    const validatedData = validation.data
    const tagsRaw = formData.get('tags')?.toString().trim()
    let tags: string[] = []
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw)
      } catch (e) {}
    }

    // Server-side Plan Limit Check (CRITICAL SECURITY & BILLING REQUIREMENT)
    const limitCheck = await checkClientLimit(session.organization.id)
    if (!limitCheck.allowed) {
      return {
        error: `You've reached your plan's client limit (${limitCheck.maxLimit} clients). Please upgrade your plan to add more clients.`,
      }
    }

    let newClient: { id: string } | null = null
    let insertError: any = null

    try {
      newClient = await queryOne<{ id: string }>(
        `INSERT INTO clients (
          organization_id, name, company, email, phone, platform, country,
          currency, payment_schedule, status, communication_mode, notes, tags,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        ) RETURNING id`,
        [
          session.organization.id,
          validatedData.name,
          validatedData.company,
          validatedData.email,
          validatedData.phone,
          validatedData.platform,
          validatedData.country,
          validatedData.currency,
          validatedData.payment_schedule,
          rawData.status,
          validatedData.communication_mode,
          validatedData.notes,
          tags,
        ]
      )
    } catch (err: any) {
      insertError = err
    }

    if ((insertError || !newClient) && process.env.DEV_SUPER_ADMIN === 'true') {
      const devClientId = 'dev-client-' + Date.now()
      const devRecord = {
        id: devClientId,
        organization_id: session.organization.id,
        name: validatedData.name,
        company: validatedData.company,
        email: validatedData.email,
        phone: validatedData.phone,
        platform: validatedData.platform,
        country: validatedData.country,
        currency: validatedData.currency,
        payment_schedule: validatedData.payment_schedule,
        status: rawData.status,
        communication_mode: validatedData.communication_mode,
        notes: validatedData.notes,
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
          name: validatedData.name,
          communication_mode: validatedData.communication_mode,
          platform: validatedData.platform,
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

    try {
      await query(
        `DELETE FROM clients WHERE id = $1 AND organization_id = $2`,
        [clientId, session.organization.id]
      )
    } catch (deleteError: any) {
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

    const rawData = {
      name: formData.get('name')?.toString(),
      company: formData.get('company')?.toString() || null,
      email: formData.get('email')?.toString() || null,
      phone: formData.get('phone')?.toString() || null,
      platform: formData.get('platform')?.toString() || 'WhatsApp',
      country: formData.get('country')?.toString() || null,
      currency: formData.get('currency')?.toString() || 'USD',
      payment_schedule: formData.get('payment_schedule')?.toString() || 'Per Project',
      status: formData.get('status')?.toString() || 'active',
      communication_mode: formData.get('communication_mode')?.toString() || 'manual',
      notes: formData.get('notes')?.toString() || null,
    }

    const validation = validateAndSanitize(UpdateClientSchema, rawData)
    if (!validation.success) {
      return { error: validation.error }
    }

    const validatedData = validation.data
    const tagsRaw = formData.get('tags')?.toString().trim()
    let tags: string[] | undefined = undefined
    if (tagsRaw !== undefined && tagsRaw !== null) {
      try {
        tags = JSON.parse(tagsRaw)
      } catch (e) {}
    }

    // Enforce strict one-way transition rule: connected -> manual is blocked
    try {
      const existingClient = await queryOne<{ communication_mode: string }>(
        `SELECT communication_mode FROM clients WHERE id = $1 AND organization_id = $2`,
        [clientId, session.organization.id]
      )

      if (existingClient?.communication_mode === 'connected' && validatedData.communication_mode === 'manual') {
        return { error: 'Connected mode is permanent and cannot be reverted to manual.' }
      }
    } catch (e) {}

    let updateError: any = null
    try {
      if (tags !== undefined) {
        await query(
          `UPDATE clients
           SET name = $1, company = $2, email = $3, phone = $4, platform = $5,
               country = $6, currency = $7, payment_schedule = $8, status = $9,
               communication_mode = $10, notes = $11, tags = $12, updated_at = NOW()
           WHERE id = $13 AND organization_id = $14`,
          [
            validatedData.name,
            validatedData.company,
            validatedData.email,
            validatedData.phone,
            validatedData.platform,
            validatedData.country,
            validatedData.currency,
            validatedData.payment_schedule,
            validatedData.status || rawData.status,
            validatedData.communication_mode,
            validatedData.notes,
            tags,
            clientId,
            session.organization.id,
          ]
        )
      } else {
        await query(
          `UPDATE clients
           SET name = $1, company = $2, email = $3, phone = $4, platform = $5,
               country = $6, currency = $7, payment_schedule = $8, status = $9,
               communication_mode = $10, notes = $11, updated_at = NOW()
           WHERE id = $12 AND organization_id = $13`,
          [
            validatedData.name,
            validatedData.company,
            validatedData.email,
            validatedData.phone,
            validatedData.platform,
            validatedData.country,
            validatedData.currency,
            validatedData.payment_schedule,
            validatedData.status || rawData.status,
            validatedData.communication_mode,
            validatedData.notes,
            clientId,
            session.organization.id,
          ]
        )
      }
    } catch (err) {
      updateError = err
    }

    if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS) {
      const idx = (global as any).__DEV_CLIENTS.findIndex((c: any) => c.id === clientId)
      if (idx !== -1) {
        ;(global as any).__DEV_CLIENTS[idx] = {
          ...(global as any).__DEV_CLIENTS[idx],
          name: validatedData.name,
          company: validatedData.company,
          email: validatedData.email,
          phone: validatedData.phone,
          platform: validatedData.platform,
          country: validatedData.country,
          currency: validatedData.currency,
          payment_schedule: validatedData.payment_schedule,
          status: validatedData.status || rawData.status,
          communication_mode: validatedData.communication_mode,
          notes: validatedData.notes,
          ...(tags !== undefined ? { tags } : {}),
          updated_at: new Date().toISOString(),
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
          name: validatedData.name,
          communication_mode: validatedData.communication_mode,
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

    try {
      await query(
        `UPDATE clients SET notes = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3`,
        [notes, clientId, session.organization.id]
      )
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

/**
 * Upgrades a client from 'manual' to 'connected' mode.
 * Enforces:
 * 1. Organization RLS & multi-tenancy context
 * 2. Role gating (owner, admin, or member)
 * 3. Strict one-way rule: manual -> connected is allowed; once connected, it cannot be reverted.
 * 4. Idempotent: safe to call if already connected.
 */
export async function switchClientToConnectedModeAction(clientId: string) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized. Active session context not found.' }
    }

    const allowedRoles = ['owner', 'admin', 'member']
    if (!allowedRoles.includes(session.role || '') && !session.isSuperAdmin) {
      return { error: 'Forbidden. You do not have permission to change client communication mode.' }
    }

    const orgId = session.organization.id

    // Query client to check current mode and organization ownership
    let currentClient: any = null
    try {
      const data = await queryOne<any>(
        `SELECT id, name, communication_mode, organization_id FROM clients WHERE id = $1 AND organization_id = $2`,
        [clientId, orgId]
      )
      if (data) {
        currentClient = data
      }
    } catch (e) {}

    if (!currentClient && process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS) {
      currentClient = (global as any).__DEV_CLIENTS.find(
        (c: any) => c.id === clientId && c.organization_id === orgId
      )
    }

    if (!currentClient) {
      return { error: 'Client not found in your organization.' }
    }

    // Idempotent: already connected
    if (currentClient.communication_mode === 'connected') {
      return { success: true, message: 'Client is already in Connected mode.' }
    }

    try {
      await query(
        `UPDATE clients SET communication_mode = 'connected', updated_at = NOW() WHERE id = $1 AND organization_id = $2`,
        [clientId, orgId]
      )
    } catch (err: any) {
      console.error('PostgreSQL update error:', err)
      return { error: err.message }
    }

    // In-memory dev fallback
    if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS) {
      const idx = (global as any).__DEV_CLIENTS.findIndex((c: any) => c.id === clientId)
      if (idx !== -1) {
        ;(global as any).__DEV_CLIENTS[idx].communication_mode = 'connected'
        ;(global as any).__DEV_CLIENTS[idx].updated_at = new Date().toISOString()
      }
    }

    // Audit logging
    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'CLIENT_COMMUNICATION_MODE_SWITCHED',
        targetType: 'client',
        targetId: clientId,
        details: {
          client_name: currentClient.name,
          from_mode: 'manual',
          to_mode: 'connected',
          organizationId: session.organization.id,
        },
      })
    } catch (e) {}

    revalidatePath(`/clients/${clientId}`)
    revalidatePath(`/clients/${clientId}/communications`)
    revalidatePath('/clients')
    revalidatePath('/inbox')

    return { success: true, message: 'Client successfully upgraded to Connected Hub mode.' }
  } catch (error: any) {
    console.error('switchClientToConnectedModeAction error:', error)
    return { error: error?.message || 'Internal server error occurred.' }
  }
}
