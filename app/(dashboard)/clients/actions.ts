'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { requireRole } from '@/lib/auth/server-guard'
import { query, queryOne, transaction } from '@/lib/db'
import { checkClientLimit } from '@/lib/services/plan-limits'
import { logAuditEvent } from '@/lib/audit/logger'
import { validateAndSanitize } from '@/lib/validation/action-wrapper'
import { CreateClientSchema, UpdateClientSchema } from '@/lib/validation/schemas'
import { revalidatePath } from 'next/cache'

export type CreateClientActionResult = {
  success: boolean;
  clientId?: string;
  error?: string;
  code?: string;
  currentCount?: number;
  limit?: number;
  planName?: string;
  upgradeUrl?: string;
};

export async function createClientAction(formData: FormData): Promise<CreateClientActionResult> {
  const session = await requireRole(['owner', 'admin', 'member'])

  const orgId = session.organization.id

  try {
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
      return { success: false, error: validation.error }
    }

    const validatedData = validation.data
    const tagsRaw = formData.get('tags')?.toString().trim()
    let tags: string[] = []
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw)
      } catch (e) {}
    }

    // Atomic server-side Plan Limit Check & Insertion with row lock
    const txResult = await transaction(async (client) => {
      await client.query('SELECT id FROM organizations WHERE id = $1 FOR UPDATE', [orgId]);

      const limitCheck = await checkClientLimit(orgId, { client });
      if (!limitCheck.allowed) {
        return {
          limitError: {
            error: limitCheck.message || `You've reached your plan's client limit (${limitCheck.limit} clients). Please upgrade your plan to add more clients.`,
            code: 'CLIENT_LIMIT_REACHED',
            currentCount: limitCheck.currentCount,
            limit: limitCheck.limit,
            planName: limitCheck.planName,
            upgradeUrl: limitCheck.upgradeUrl,
          },
          newClient: null,
        };
      }

      const insertRes = await client.query<{ id: string }>(
        `INSERT INTO clients (
          organization_id, name, company, email, phone, platform, country,
          currency, payment_schedule, status, communication_mode, notes, tags,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        ) RETURNING id`,
        [
          orgId,
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
      );

      return { limitError: null, newClient: insertRes.rows[0] };
    });

    if (txResult.limitError) {
      return {
        success: false,
        error: txResult.limitError.error,
        code: txResult.limitError.code,
        currentCount: txResult.limitError.currentCount,
        limit: txResult.limitError.limit,
        planName: txResult.limitError.planName,
        upgradeUrl: txResult.limitError.upgradeUrl,
      };
    }

    const newClient = txResult.newClient;
    if (!newClient) {
      return { success: false, error: 'Database error occurred while creating client.' };
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
    if (error.message === 'UNAUTHENTICATED' || error.message === 'INSUFFICIENT_ROLE' || error.message === 'NOT_FOUND') {
      throw error
    }
    console.error('createClientAction error:', error)
    return { success: false, error: error?.message || 'Internal server error occurred.' }
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
  const session = await requireRole(['owner', 'admin', 'member'])

  try {

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
    if (error.message === 'UNAUTHENTICATED' || error.message === 'INSUFFICIENT_ROLE' || error.message === 'NOT_FOUND') {
      throw error
    }
    console.error('updateClientAction error:', error)
    return { error: error?.message || 'Internal server error.' }
  }
}

export async function updateClientNotesAction(clientId: string, notes: string) {
  const session = await requireRole(['owner', 'admin', 'member'])

  try {
    await query(
      `UPDATE clients SET notes = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3`,
      [notes, clientId, session.organization.id]
    )

    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED' || error.message === 'INSUFFICIENT_ROLE' || error.message === 'NOT_FOUND') {
      throw error
    }
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
