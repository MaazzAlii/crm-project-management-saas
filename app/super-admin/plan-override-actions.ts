'use server';

/**
 * =============================================================================
 * Super-Admin Plan Override Server Actions (BILL-3B)
 * =============================================================================
 * Gated by requireSuperAdmin().
 */

import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/lib/auth/super-admin';
import { getCurrentSessionContext } from '@/lib/auth/session';
import {
  grantPlanOverride,
  revokePlanOverride,
  OverrideDuration,
  GrantOverrideResult,
  RevokeOverrideResult,
} from '@/lib/services/plan-override';

export interface GrantOverrideActionInput {
  organizationId: string;
  duration: OverrideDuration;
  customExpiresAt?: string | null;
  note?: string | null;
}

export async function grantPlanOverrideAction(
  params: GrantOverrideActionInput
): Promise<GrantOverrideResult> {
  try {
    await requireSuperAdmin();
    const session = await getCurrentSessionContext();
    if (!session || !session.user) {
      return { success: false, error: 'Unauthorized: No active super admin session found' };
    }

    const { organizationId, duration, customExpiresAt, note } = params;

    const result = await grantPlanOverride({
      organizationId,
      duration,
      customExpiresAt,
      note,
      grantedByUserId: session.user.id,
    });

    if (result.success) {
      revalidatePath('/super-admin/organizations');
      revalidatePath(`/super-admin/organizations/${organizationId}`);
      revalidatePath('/super-admin/dashboard');
    }

    return result;
  } catch (err: any) {
    console.error('[grantPlanOverrideAction] Error:', err);
    return { success: false, error: err.message || 'Failed to grant plan override' };
  }
}

export async function revokePlanOverrideAction(
  organizationId: string
): Promise<RevokeOverrideResult> {
  try {
    await requireSuperAdmin();
    const session = await getCurrentSessionContext();
    if (!session || !session.user) {
      return { success: false, error: 'Unauthorized: No active super admin session found' };
    }

    const result = await revokePlanOverride(organizationId, session.user.id);

    if (result.success) {
      revalidatePath('/super-admin/organizations');
      revalidatePath(`/super-admin/organizations/${organizationId}`);
      revalidatePath('/super-admin/dashboard');
    }

    return result;
  } catch (err: any) {
    console.error('[revokePlanOverrideAction] Error:', err);
    return { success: false, error: err.message || 'Failed to revoke plan override' };
  }
}
