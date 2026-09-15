'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { checkClientLimit } from '@/lib/billing/plan-limits'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'

export const VALID_PIPELINE_STAGES = [
  'new',
  'contacted',
  'qualified',
  'proposal_sent',
  'won',
  'lost',
] as const

export type PipelineStage = typeof VALID_PIPELINE_STAGES[number]

export async function updateLeadStageAction(
  clientId: string,
  newStage: PipelineStage,
  lostReason?: string
) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized session.' }
    }

    if (!VALID_PIPELINE_STAGES.includes(newStage)) {
      return { error: 'Invalid pipeline stage value.' }
    }

    const supabase = await createClient()

    const updatePayload: any = {
      pipeline_stage: newStage,
      stage_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (newStage === 'won') {
      updatePayload.status = 'active'
    } else if (newStage === 'lost') {
      updatePayload.lost_reason = lostReason || 'No reason specified'
    } else {
      updatePayload.lost_reason = null
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

    // Dev mode fallback
    if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS) {
      const idx = (global as any).__DEV_CLIENTS.findIndex((c: any) => c.id === clientId)
      if (idx !== -1) {
        ;(global as any).__DEV_CLIENTS[idx] = {
          ...(global as any).__DEV_CLIENTS[idx],
          ...updatePayload,
        }
      }
    }

    // Audit Log
    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'LEAD_STAGE_UPDATED',
        targetType: 'client',
        targetId: clientId,
        details: {
          newStage,
          lostReason: newStage === 'lost' ? lostReason : undefined,
          organizationId: session.organization.id,
        },
      })
    } catch (e) {}

    revalidatePath('/leads')
    revalidatePath('/clients')
    revalidatePath(`/clients/${clientId}`)
    revalidatePath(`/clients/${clientId}/pipeline`)
    return { success: true }
  } catch (error: any) {
    console.error('updateLeadStageAction error:', error)
    return { error: error?.message || 'Internal server error.' }
  }
}

export async function createLeadAction(formData: FormData) {
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
    const deal_value = parseFloat(formData.get('deal_value')?.toString() || '0')
    const pipeline_stage = (formData.get('pipeline_stage')?.toString().trim() || 'new') as PipelineStage
    const communication_mode = (formData.get('communication_mode')?.toString().trim() || 'manual') as 'manual' | 'connected'
    const notes = formData.get('notes')?.toString().trim() || null

    if (!name) {
      return { error: 'Lead/Client name is required.' }
    }

    // Plan limit check
    const limitCheck = await checkClientLimit(session.organization.id)
    if (!limitCheck.allowed) {
      return {
        error: `You've reached your plan's client limit (${limitCheck.maxLimit} clients/leads). Please upgrade to add more.`,
      }
    }

    const status = pipeline_stage === 'won' ? 'active' : 'lead'

    const supabase = await createClient()

    let newLead: { id: string } | null = null
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
          deal_value,
          pipeline_stage,
          status,
          communication_mode,
          notes,
          stage_updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      newLead = data
      insertError = error
    } catch (err: any) {
      insertError = err
    }

    if ((insertError || !newLead) && process.env.DEV_SUPER_ADMIN === 'true') {
      const devLeadId = 'dev-lead-' + Date.now()
      const devRecord = {
        id: devLeadId,
        organization_id: session.organization.id,
        name,
        company,
        email,
        phone,
        platform,
        country,
        currency,
        deal_value,
        pipeline_stage,
        status,
        communication_mode,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        stage_updated_at: new Date().toISOString(),
      }
      ;(global as any).__DEV_CLIENTS = (global as any).__DEV_CLIENTS || []
      ;(global as any).__DEV_CLIENTS.unshift(devRecord)

      revalidatePath('/leads')
      revalidatePath('/clients')
      return { success: true, leadId: devLeadId }
    }

    if (insertError || !newLead) {
      console.error('Failed to create lead record:', insertError)
      return { error: insertError?.message || 'Database error occurred while creating lead.' }
    }

    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'LEAD_CREATED',
        targetType: 'client',
        targetId: newLead.id,
        details: {
          name,
          deal_value,
          pipeline_stage,
          organizationId: session.organization.id,
        },
      })
    } catch (e) {}

    revalidatePath('/leads')
    revalidatePath('/clients')
    return { success: true, leadId: newLead.id }
  } catch (error: any) {
    console.error('createLeadAction error:', error)
    return { error: error?.message || 'Internal server error occurred.' }
  }
}
