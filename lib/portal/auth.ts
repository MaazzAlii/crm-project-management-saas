import crypto from 'crypto'
import { redirect } from 'next/navigation'
import { query, queryOne } from '@/lib/db'
import { userRepo } from '@/lib/db/repositories/user-repo'
import { getCurrentSessionContext, deleteRefreshTokenCookie } from '@/lib/auth/session'
import { createMagicLinkToken } from '@/lib/auth/magic-link'
import { logAuditEvent } from '@/lib/audit/logger'

/**
 * Validates the current session is an active portal user with plan access.
 * Call at the top of every server component in the (client-portal) group.
 *
 * Returns { clientUser, clientId, organizationId } on success.
 * Redirects to /client/login on any failure (no session, no portal record, plan not enabled).
 */
export async function requirePortalSession() {
  const session = await getCurrentSessionContext()

  if (!session || !session.user) {
    redirect('/client/login')
  }

  const clientUser = await queryOne<{
    id: string
    client_id: string
    organization_id: string
    is_active: boolean
  }>(
    'SELECT id, client_id, organization_id, is_active FROM client_users WHERE user_id = $1 AND is_active = true',
    [session.user.id]
  )

  if (!clientUser) {
    await deleteRefreshTokenCookie()
    redirect('/client/login?error=no_portal_access')
  }

  // Check plan gate: client_portal_enabled must be true on the org's plan
  const planRow = await queryOne<{ feature_limits: any }>(
    `SELECT sp.feature_limits
     FROM organization_subscriptions os
     JOIN subscription_plans sp ON sp.id = os.plan_id
     WHERE os.organization_id = $1 AND os.status IN ('active', 'trialing')
     LIMIT 1`,
    [clientUser.organization_id]
  )

  const featureLimits = planRow?.feature_limits ?? {}
  if (!featureLimits.client_portal_enabled) {
    redirect('/client/login?error=portal_not_available')
  }

  return {
    clientUser,
    clientId: clientUser.client_id,
    organizationId: clientUser.organization_id,
  }
}

/**
 * Server action: invite a client to the portal by sending a magic link.
 * Only org owners/admins may call this.
 */
export async function inviteClientToPortal(
  clientId: string,
  email: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getCurrentSessionContext()
  if (!session || !session.user) return { success: false, error: 'Unauthorized' }

  // Authorization: must be org owner or admin
  const member = await queryOne<{ role: string }>(
    'SELECT role FROM organization_members WHERE user_id = $1 AND organization_id = $2',
    [session.user.id, organizationId]
  )

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { success: false, error: 'Only org owners and admins can invite clients.' }
  }

  // Plan gate check
  const planRow = await queryOne<{ feature_limits: any }>(
    `SELECT sp.feature_limits
     FROM organization_subscriptions os
     JOIN subscription_plans sp ON sp.id = os.plan_id
     WHERE os.organization_id = $1 AND os.status IN ('active', 'trialing')
     LIMIT 1`,
    [organizationId]
  )

  const featureLimits = planRow?.feature_limits ?? {}
  if (!featureLimits.client_portal_enabled) {
    return { success: false, error: 'Client Portal is not available on your current plan. Please upgrade.' }
  }

  // Verify client belongs to this org
  const client = await queryOne<{ id: string }>(
    'SELECT id FROM clients WHERE id = $1 AND organization_id = $2',
    [clientId, organizationId]
  )

  if (!client) {
    return { success: false, error: 'Client not found.' }
  }

  const cleanEmail = email.toLowerCase().trim()

  // Find or create user
  let user = await userRepo.findByEmail(cleanEmail)
  if (!user) {
    const placeholderHash = `magic_link_user_${crypto.randomBytes(16).toString('hex')}`
    user = await userRepo.create({
      email: cleanEmail,
      passwordHash: placeholderHash,
      fullName: cleanEmail.split('@')[0],
      role: 'user',
    })
  }

  // Upsert client_users
  await query(
    `INSERT INTO client_users (client_id, user_id, organization_id, is_active, invited_at)
     VALUES ($1, $2, $3, true, NOW())
     ON CONFLICT (user_id, organization_id)
     DO UPDATE SET client_id = EXCLUDED.client_id, is_active = true, invited_at = NOW()`,
    [clientId, user.id, organizationId]
  )

  // Generate magic link token
  const magicLink = await createMagicLinkToken(cleanEmail)

  // Audit trail
  try {
    await query(
      `INSERT INTO portal_magic_links (client_id, email, sent_at, created_by)
       VALUES ($1, $2, NOW(), $3)`,
      [clientId, cleanEmail, session.user.id]
    )
  } catch {
    // If portal_magic_links doesn't exist, continue
  }

  try {
    await logAuditEvent({
      actorId: session.user.id,
      organizationId,
      action: 'PORTAL_USER_INVITED',
      targetType: 'client_portal',
      targetId: clientId,
      details: { invitedEmail: cleanEmail, clientId, verificationUrl: magicLink.url },
    })
  } catch (e) {}

  return { success: true }
}

/**
 * Server action: revoke a client's portal access.
 */
export async function revokePortalAccess(
  clientUserId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getCurrentSessionContext()
  if (!session || !session.user) return { success: false, error: 'Unauthorized' }

  const member = await queryOne<{ role: string }>(
    'SELECT role FROM organization_members WHERE user_id = $1 AND organization_id = $2',
    [session.user.id, organizationId]
  )

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { success: false, error: 'Only org owners and admins can revoke portal access.' }
  }

  await query(
    'UPDATE client_users SET is_active = false, updated_at = NOW() WHERE id = $1 AND organization_id = $2',
    [clientUserId, organizationId]
  )

  try {
    await logAuditEvent({
      actorId: session.user.id,
      organizationId,
      action: 'PORTAL_USER_REVOKED',
      targetType: 'client_portal',
      targetId: clientUserId,
      details: { clientUserId, organizationId },
    })
  } catch (e) {}

  return { success: true }
}
