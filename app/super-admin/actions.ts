'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { logAuditEvent } from '@/lib/audit/logger'

export async function toggleSuspendOrganization(
  orgId: string,
  suspend: boolean,
  reason?: string
) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const updatePayload = {
      is_suspended: suspend,
      suspended_reason: suspend ? (reason || 'Administrative suspension by platform operator.') : null,
      suspended_at: suspend ? new Date().toISOString() : null,
    }

    const { error } = await supabase
      .from('organizations')
      .update(updatePayload)
      .eq('id', orgId)

    if (error) throw new Error(error.message)

    await logAuditEvent({
      actorId: user?.id,
      action: suspend ? 'ORGANIZATION_SUSPENDED' : 'ORGANIZATION_RESUMED',
      targetType: 'ORGANIZATION',
      targetId: orgId,
      details: { reason: updatePayload.suspended_reason },
    })

    revalidatePath('/super-admin/organizations')
    revalidatePath(`/super-admin/organizations/${orgId}`)
    revalidatePath('/super-admin/dashboard')

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to update organization suspension status.' }
  }
}

export async function overrideOrganizationPlan(
  orgId: string,
  newPlanTier: 'free' | 'starter' | 'pro' | 'enterprise',
  reason?: string
) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Update organization plan tier
    const { error: orgError } = await supabase
      .from('organizations')
      .update({ plan_tier: newPlanTier })
      .eq('id', orgId)

    if (orgError) throw new Error(orgError.message)

    // 2. Fetch corresponding subscription_plans record for newPlanTier
    const { data: planRecord } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('slug', newPlanTier)
      .maybeSingle()

    if (planRecord) {
      await supabase
        .from('organization_subscriptions')
        .upsert(
          {
            organization_id: orgId,
            plan_id: planRecord.id,
            status: 'active',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id' }
        )
    }

    await logAuditEvent({
      actorId: user?.id,
      action: 'ORGANIZATION_PLAN_OVERRIDDEN',
      targetType: 'ORGANIZATION',
      targetId: orgId,
      details: {
        newPlanTier,
        reason: reason || 'Manual plan override by super admin operator.',
      },
    })

    revalidatePath('/super-admin/organizations')
    revalidatePath(`/super-admin/organizations/${orgId}`)
    revalidatePath('/super-admin/dashboard')

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to override organization plan.' }
  }
}
