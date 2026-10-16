'use server'

import { query, queryOne, transaction } from '@/lib/db'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'

export interface UpdateUserInput {
  fullName: string
  email: string
}

export interface UserActionResult {
  success: boolean
  error?: string
  code?: string
  status?: number
}

/**
 * Super Admin Action: Edit User Profile (Full Name, Email)
 */
export async function updateSuperAdminUserAction(
  userId: string,
  input: UpdateUserInput
): Promise<UserActionResult> {
  try {
    await requireSuperAdmin()
    const session = await getCurrentSessionContext()
    if (!session || !session.user) {
      return { success: false, error: 'Unauthorized: No active super admin session found' }
    }

    const trimmedName = input.fullName?.trim() || ''
    const trimmedEmail = input.email?.trim().toLowerCase() || ''

    if (!trimmedName) {
      return { success: false, error: 'Full name is required.' }
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' }
    }

    // Check if email is already taken by another user
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 AND id != $2`,
      [trimmedEmail, userId]
    )

    if (existing) {
      return {
        success: false,
        error: 'Email address is already in use by another account.',
        code: 'EMAIL_ALREADY_EXISTS',
      }
    }

    await transaction(async (client) => {
      await client.query(
        `UPDATE users SET full_name = $1, email = $2, updated_at = NOW() WHERE id = $3`,
        [trimmedName, trimmedEmail, userId]
      )
      // Mirror to profiles table if present
      await client.query(
        `UPDATE profiles SET full_name = $1, email = $2, updated_at = NOW() WHERE id = $3`,
        [trimmedName, trimmedEmail, userId]
      )
    })

    await logAuditEvent({
      actorId: session.user.id,
      action: 'SUPER_ADMIN_USER_UPDATED',
      targetType: 'user',
      targetId: userId,
      details: {
        newFullName: trimmedName,
        newEmail: trimmedEmail,
      },
    })

    try {
      revalidatePath('/super-admin/organizations')
      revalidatePath('/super-admin/dashboard')
    } catch {}
    return { success: true }
  } catch (err: any) {
    console.error('[updateSuperAdminUserAction] Error:', err)
    return { success: false, error: err.message || 'Failed to update user profile' }
  }
}

/**
 * Super Admin Action: Toggle Active Status (Soft Delete / Reactivation)
 */
export async function toggleSuperAdminUserActiveAction(
  userId: string,
  isActive: boolean
): Promise<UserActionResult> {
  try {
    await requireSuperAdmin()
    const session = await getCurrentSessionContext()
    if (!session || !session.user) {
      return { success: false, error: 'Unauthorized: No active super admin session found' }
    }

    if (session.user.id === userId && !isActive) {
      return {
        success: false,
        error: 'Cannot deactivate your own super admin account.',
        code: 'SELF_DEACTIVATION_BLOCKED',
      }
    }

    await query(`UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2`, [
      isActive,
      userId,
    ])

    // If deactivating, revoke active refresh tokens and sessions
    if (!isActive) {
      await query(`UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1`, [userId])
      await query(`UPDATE sessions SET is_active = false WHERE user_id = $1`, [userId])
    }

    await logAuditEvent({
      actorId: session.user.id,
      action: isActive ? 'SUPER_ADMIN_USER_REACTIVATED' : 'SUPER_ADMIN_USER_DEACTIVATED',
      targetType: 'user',
      targetId: userId,
      details: { isActive },
    })

    try {
      revalidatePath('/super-admin/organizations')
      revalidatePath('/super-admin/dashboard')
    } catch {}
    return { success: true }
  } catch (err: any) {
    console.error('[toggleSuperAdminUserActiveAction] Error:', err)
    return { success: false, error: err.message || 'Failed to toggle user status' }
  }
}

/**
 * Super Admin Action: Hard Delete User
 * Guardrails:
 * - Blocked if caller attempts to delete their own account.
 * - Blocked if user is an owner or admin of any organization (must transfer ownership first).
 * - Requires typed email confirmation matching user email.
 */
export async function deleteSuperAdminUserAction(
  userId: string,
  confirmEmail: string
): Promise<UserActionResult> {
  try {
    await requireSuperAdmin()
    const session = await getCurrentSessionContext()
    if (!session || !session.user) {
      return { success: false, error: 'Unauthorized: No active super admin session found' }
    }

    if (session.user.id === userId) {
      return {
        success: false,
        error: 'Cannot delete your own super admin account.',
        code: 'SELF_DELETION_BLOCKED',
      }
    }

    const targetUser = await queryOne<{ id: string; email: string; full_name: string }>(
      'SELECT id, email, full_name FROM users WHERE id = $1',
      [userId]
    )

    if (!targetUser) {
      return { success: false, error: 'User not found.', code: 'NOT_FOUND' }
    }

    const typedEmail = confirmEmail?.trim().toLowerCase() || ''
    if (typedEmail !== targetUser.email.toLowerCase()) {
      return {
        success: false,
        error: `Typed email confirmation does not match '${targetUser.email}'.`,
        code: 'TYPED_CONFIRMATION_REQUIRED',
        status: 400,
      }
    }

    // Safety Guardrail: Block if user is an owner or admin of ANY organization
    const ownership = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM organization_members WHERE user_id = $1 AND role IN ('owner', 'admin')`,
      [userId]
    )

    if (ownership && ownership.count > 0) {
      return {
        success: false,
        error: `Cannot delete user: user is an owner or admin in ${ownership.count} organization(s). Transfer ownership or remove administrative roles before deleting.`,
        code: 'USER_HAS_ACTIVE_OWNERSHIP',
        status: 400,
      }
    }

    // Perform safe transactional deletion
    await transaction(async (client) => {
      await client.query('UPDATE organization_members SET invited_by = NULL WHERE invited_by = $1', [userId])
      await client.query('UPDATE portal_magic_links SET created_by = NULL WHERE created_by = $1', [userId])
      await client.query('DELETE FROM organization_members WHERE user_id = $1', [userId])
      await client.query('DELETE FROM profiles WHERE id = $1', [userId])
      await client.query('DELETE FROM users WHERE id = $1', [userId])
    })

    await logAuditEvent({
      actorId: session.user.id,
      action: 'SUPER_ADMIN_USER_DELETED',
      targetType: 'user',
      targetId: userId,
      details: {
        deletedUserEmail: targetUser.email,
        deletedUserName: targetUser.full_name,
      },
    })

    try {
      revalidatePath('/super-admin/organizations')
      revalidatePath('/super-admin/dashboard')
    } catch {}
    return { success: true }
  } catch (err: any) {
    console.error('[deleteSuperAdminUserAction] Error:', err)
    return { success: false, error: err.message || 'Failed to delete user' }
  }
}
