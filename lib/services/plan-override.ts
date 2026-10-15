/**
 * =============================================================================
 * Innoventix Platform — Super-Admin Plan Override Service (BILL-3B)
 * =============================================================================
 * Handles granting and revoking plan overrides (lifetime, sponsored durations,
 * custom expiry, and manual tiers) with strict audit logging and cache eviction.
 */

import { query, queryOne } from '../db';
import { logAuditEvent } from '../audit/logger';
import { invalidatePlanCache } from '../billing/current-plan';

export type OverrideDuration =
  | 'lifetime'
  | '1_month'
  | '3_month'
  | '6_month'
  | '12_month'
  | 'custom'
  | 'enterprise'
  | 'pro';

export interface GrantOverrideInput {
  organizationId: string;
  duration: OverrideDuration;
  customExpiresAt?: Date | string | null;
  note?: string | null;
  grantedByUserId: string;
}

export interface PlanOverrideRecord {
  plan_override: string | null;
  plan_override_expires_at: Date | null;
  plan_override_granted_at: Date | null;
  plan_override_granted_by: string | null;
  plan_override_note: string | null;
}

export interface GrantOverrideResult {
  success: boolean;
  error?: string;
  override?: {
    plan_override: string;
    plan_override_expires_at: Date | null;
    plan_override_granted_at: Date;
    plan_override_granted_by: string;
    plan_override_note: string | null;
  };
}

export interface RevokeOverrideResult {
  success: boolean;
  error?: string;
}

/**
 * Grant a new plan override to an organization.
 * Replaces any existing override atomically.
 */
export async function grantPlanOverride(
  input: GrantOverrideInput
): Promise<GrantOverrideResult> {
  const { organizationId, duration, customExpiresAt, note, grantedByUserId } = input;

  if (!organizationId) {
    return { success: false, error: 'Organization ID is required' };
  }
  if (!grantedByUserId) {
    return { success: false, error: 'Granting user ID is required' };
  }

  // 1. Validate custom expiry date if duration is 'custom'
  let customDateObj: Date | null = null;
  if (duration === 'custom') {
    if (!customExpiresAt) {
      return { success: false, error: 'Custom expiration date is required when duration is custom' };
    }
    customDateObj = new Date(customExpiresAt);
    if (isNaN(customDateObj.getTime())) {
      return { success: false, error: 'Invalid custom expiration date format' };
    }
    if (customDateObj.getTime() <= Date.now()) {
      return { success: false, error: 'Custom expiration date must be in the future' };
    }
  }

  // 2. Map duration to plan_override slug
  const planOverrideSlug = duration;

  // 3. Compute SQL snippet for expires_at using Postgres NOW() + INTERVAL
  let expirySql = 'NULL';
  const queryParams: any[] = [organizationId, planOverrideSlug, grantedByUserId, note || null];

  switch (duration) {
    case '1_month':
      expirySql = "NOW() + INTERVAL '1 month'";
      break;
    case '3_month':
      expirySql = "NOW() + INTERVAL '3 months'";
      break;
    case '6_month':
      expirySql = "NOW() + INTERVAL '6 months'";
      break;
    case '12_month':
      expirySql = "NOW() + INTERVAL '12 months'";
      break;
    case 'custom':
      queryParams.push(customDateObj!.toISOString());
      expirySql = `$${queryParams.length}::timestamptz`;
      break;
    case 'lifetime':
    case 'enterprise':
    case 'pro':
    default:
      expirySql = 'NULL';
      break;
  }

  try {
    // 4. Upsert into organization_plans
    const upsertSql = `
      INSERT INTO organization_plans (
        organization_id,
        plan_id,
        status,
        plan_override,
        plan_override_expires_at,
        plan_override_granted_by,
        plan_override_granted_at,
        plan_override_note,
        updated_at
      )
      VALUES (
        $1,
        '${duration === 'pro' ? 'pro' : 'enterprise'}',
        'active',
        $2,
        ${expirySql},
        $3,
        NOW(),
        $4,
        NOW()
      )
      ON CONFLICT (organization_id) DO UPDATE SET
        plan_override = EXCLUDED.plan_override,
        plan_override_expires_at = ${expirySql},
        plan_override_granted_by = EXCLUDED.plan_override_granted_by,
        plan_override_granted_at = NOW(),
        plan_override_note = EXCLUDED.plan_override_note,
        updated_at = NOW()
      RETURNING
        plan_override,
        plan_override_expires_at,
        plan_override_granted_at,
        plan_override_granted_by,
        plan_override_note;
    `;

    const res = await query<PlanOverrideRecord>(upsertSql, queryParams);
    const row = res.rows[0];

    // 5. Invalidate current plan cache immediately
    invalidatePlanCache(organizationId);

    // 6. Record immutable audit log entry
    await logAuditEvent({
      organizationId,
      actorId: grantedByUserId,
      actorIsSuperAdmin: true,
      action: 'PLAN_OVERRIDE_GRANTED',
      targetType: 'ORGANIZATION',
      targetId: organizationId,
      details: {
        duration,
        expiresAt: row.plan_override_expires_at ? row.plan_override_expires_at.toISOString() : null,
        note: row.plan_override_note,
      },
    });

    return {
      success: true,
      override: {
        plan_override: row.plan_override || planOverrideSlug,
        plan_override_expires_at: row.plan_override_expires_at,
        plan_override_granted_at: row.plan_override_granted_at || new Date(),
        plan_override_granted_by: row.plan_override_granted_by || grantedByUserId,
        plan_override_note: row.plan_override_note,
      },
    };
  } catch (err: any) {
    console.error('[grantPlanOverride] Error:', err);
    return { success: false, error: err.message || 'Failed to grant plan override' };
  }
}

/**
 * Revoke an active plan override from an organization.
 * Clears all override columns and falls back to subscription or Free.
 * Idempotent: succeeds even if no override was set.
 */
export async function revokePlanOverride(
  organizationId: string,
  revokedByUserId: string
): Promise<RevokeOverrideResult> {
  if (!organizationId) {
    return { success: false, error: 'Organization ID is required' };
  }

  try {
    // 1. Fetch previous override state for audit logging
    const prev = await queryOne<PlanOverrideRecord>(
      `SELECT plan_override, plan_override_expires_at
       FROM organization_plans
       WHERE organization_id = $1`,
      [organizationId]
    );

    // 2. Clear override columns on organization_plans
    await query(
      `UPDATE organization_plans
       SET plan_override = NULL,
           plan_override_expires_at = NULL,
           plan_override_granted_by = NULL,
           plan_override_granted_at = NULL,
           plan_override_note = NULL,
           updated_at = NOW()
       WHERE organization_id = $1`,
      [organizationId]
    );

    // 3. Invalidate plan cache
    invalidatePlanCache(organizationId);

    // 4. Record audit log entry
    await logAuditEvent({
      organizationId,
      actorId: revokedByUserId,
      actorIsSuperAdmin: true,
      action: 'PLAN_OVERRIDE_REVOKED',
      targetType: 'ORGANIZATION',
      targetId: organizationId,
      details: {
        previousOverride: prev?.plan_override || null,
        previousExpiresAt: prev?.plan_override_expires_at ? prev.plan_override_expires_at.toISOString() : null,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('[revokePlanOverride] Error:', err);
    return { success: false, error: err.message || 'Failed to revoke plan override' };
  }
}

/**
 * Fetch current override metadata for an organization
 */
export async function getPlanOverrideDetails(organizationId: string): Promise<PlanOverrideRecord | null> {
  return queryOne<PlanOverrideRecord>(
    `SELECT
       plan_override,
       plan_override_expires_at,
       plan_override_granted_at,
       plan_override_granted_by,
       plan_override_note
     FROM organization_plans
     WHERE organization_id = $1`,
    [organizationId]
  );
}
