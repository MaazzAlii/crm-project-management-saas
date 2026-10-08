'use server'

import { revalidatePath } from 'next/cache'
import { query, queryOne } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { logAuditEvent } from '@/lib/audit/logger'

export async function toggleSuspendOrganization(
  orgId: string,
  suspend: boolean,
  reason?: string
) {
  try {
    await requireSuperAdmin()
    const session = await getCurrentSessionContext()

    const suspendedReason = suspend ? (reason || 'Administrative suspension by platform operator.') : null
    const suspendedAt = suspend ? new Date().toISOString() : null

    await query(
      `UPDATE organizations
       SET is_suspended = $1, suspended_reason = $2, suspended_at = $3, updated_at = NOW()
       WHERE id = $4`,
      [suspend, suspendedReason, suspendedAt, orgId]
    )

    await logAuditEvent({
      actorId: session?.user?.id,
      action: suspend ? 'ORGANIZATION_SUSPENDED' : 'ORGANIZATION_RESUMED',
      targetType: 'ORGANIZATION',
      targetId: orgId,
      details: { reason: suspendedReason },
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
  newPlanTier: 'free' | 'starter' | 'pro' | 'agency' | 'enterprise' | 'lifetime',
  reason?: string
) {
  try {
    await requireSuperAdmin()
    const session = await getCurrentSessionContext()

    // 1. Update organization plan tier
    await query(
      `UPDATE organizations SET plan_tier = $1, updated_at = NOW() WHERE id = $2`,
      [newPlanTier, orgId]
    )

    // 2. Fetch corresponding subscription_plans record for newPlanTier
    const planRecord = await queryOne<{ id: string }>(
      `SELECT id FROM subscription_plans WHERE slug = $1`,
      [newPlanTier]
    )

    if (planRecord) {
      await query(
        `INSERT INTO organization_subscriptions (organization_id, plan_id, status, updated_at)
         VALUES ($1, $2, 'active', NOW())
         ON CONFLICT (organization_id) DO UPDATE SET
           plan_id = EXCLUDED.plan_id,
           status = 'active',
           updated_at = NOW()`,
        [orgId, planRecord.id]
      )
    }

    await logAuditEvent({
      actorId: session?.user?.id,
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
