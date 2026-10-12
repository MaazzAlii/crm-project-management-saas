'use server'

import { query, queryOne } from '@/lib/db'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'

import { sendEmail } from '@/lib/email/sender'
import { renderRoleChangedEmail } from '@/lib/email/templates'

export interface UpdateOrgProfileInput {
  organizationId: string
  name: string
  industryType: string
  logoUrl?: string
  timezone?: string
}

export interface InviteMemberInput {
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer' | 'billing_manager'
}

export interface UpdateRoleInput {
  memberId: string
  newRole: 'owner' | 'admin' | 'member' | 'viewer' | 'billing_manager'
}

export interface RemoveMemberInput {
  memberId: string
}

/**
 * Server Action: Update Organization Profile
 * Restricted to 'owner' or 'admin' roles.
 */
export async function updateOrganizationProfile(input: UpdateOrgProfileInput) {
  const session = await getCurrentSessionContext()

  if (!session || !session.user || !session.organization) {
    return { success: false, error: 'Unauthorized: No active session.' }
  }

  // Confirm target organization matches user active organization
  if (session.organization.id !== input.organizationId) {
    return { success: false, error: 'Forbidden: Organization mismatch.' }
  }

  // Server-side Role Check
  if (session.role !== 'owner' && session.role !== 'admin' && !session.isSuperAdmin) {
    return { success: false, error: 'Forbidden: Only owners and admins can edit organization profile.' }
  }

  try {
    await query(
      `UPDATE organizations
       SET name = $1,
           industry_type = $2,
           logo_url = $3,
           timezone = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [
        input.name,
        input.industryType,
        input.logoUrl || null,
        input.timezone || 'UTC',
        input.organizationId,
      ]
    )

    await logAuditEvent({
      actorId: session.user.id,
      action: 'ORGANIZATION_PROFILE_UPDATE',
      targetType: 'organization',
      targetId: input.organizationId,
      details: {
        name: input.name,
        industryType: input.industryType,
        logoUrl: input.logoUrl,
        timezone: input.timezone,
      },
    })

    revalidatePath('/settings/organization')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating organization profile:', error)
    return { success: false, error: error.message || 'Update failed' }
  }
}

/**
 * Server Action: Invite Team Member
 * Restricted to 'owner' or 'admin' roles.
 */
export async function inviteTeamMember(input: InviteMemberInput) {
  const session = await getCurrentSessionContext()

  if (!session || !session.user || !session.organization) {
    return { success: false, error: 'Unauthorized: No active session.' }
  }

  // Server-side Role Check
  if (session.role !== 'owner' && session.role !== 'admin' && !session.isSuperAdmin) {
    return { success: false, error: 'Forbidden: Only owners and admins can invite team members.' }
  }

  const cleanEmail = input.email.trim().toLowerCase()
  if (!cleanEmail) {
    return { success: false, error: 'Valid email address is required.' }
  }

  try {
    // 1. Check if user already exists with this email
    const existingUser = await queryOne<{ id: string; email: string }>(
      'SELECT id, email FROM users WHERE email = $1',
      [cleanEmail]
    )

    if (existingUser) {
      // Check if user is already a member of this organization
      const existingMember = await queryOne<{ id: string }>(
        'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
        [session.organization.id, existingUser.id]
      )

      if (existingMember) {
        return { success: false, error: 'This user is already a member of your organization.' }
      }

      // Add existing user as an org member
      await query(
        `INSERT INTO organization_members (organization_id, user_id, role, invited_by)
         VALUES ($1, $2, $3, $4)`,
        [session.organization.id, existingUser.id, input.role, session.user.id]
      )
    } else {
      console.log(`[TEAM_INVITE_STUB] Invitation dispatched to ${cleanEmail} for role ${input.role} in org ${session.organization.name}`)
    }

    await logAuditEvent({
      actorId: session.user.id,
      action: 'TEAM_MEMBER_INVITED',
      targetType: 'organization_member',
      targetId: session.organization.id,
      details: { email: cleanEmail, role: input.role },
    })

    revalidatePath('/settings/team')
    return {
      success: true,
      message: existingUser ? 'Member added successfully!' : `Invitation email stubbed for ${cleanEmail}`,
    }
  } catch (err: any) {
    console.error('Error inviting team member:', err)
    return { success: false, error: err.message || 'Invitation failed' }
  }
}

/**
 * Server Action: Update Member Role (Prompt 36)
 * Rules:
 * - Owner can change any role except their own.
 * - Admin can change member and viewer roles only, and cannot touch owner or admin.
 * - Admin cannot promote a member to admin or owner.
 * - Demoting the last owner is forbidden.
 * - Sends email notification and records audit event.
 */
export async function updateMemberRole(input: UpdateRoleInput) {
  const session = await getCurrentSessionContext()

  if (!session || !session.user || !session.organization) {
    return { success: false, error: 'Unauthorized: No active session.' }
  }

  const isOwner = session.role === 'owner' || session.isSuperAdmin
  const isAdmin = session.role === 'admin'

  if (!isOwner && !isAdmin) {
    return { success: false, error: 'Forbidden: Only owners and admins can update member roles.' }
  }

  try {
    // Fetch the target member record
    const targetMember = await queryOne<{ id: string; organization_id: string; user_id: string; role: string }>(
      'SELECT id, organization_id, user_id, role FROM organization_members WHERE id = $1 AND organization_id = $2',
      [input.memberId, session.organization.id]
    )

    if (!targetMember) {
      return { success: false, error: 'Target member record not found.' }
    }

    // Rule: Owner cannot change their own role
    if (targetMember.user_id === session.user.id) {
      return { success: false, error: 'Cannot change your own role.' }
    }

    // Rule: Admin can change member and viewer roles only, and cannot touch owner or admin
    if (isAdmin) {
      if (targetMember.role === 'owner' || targetMember.role === 'admin') {
        return { success: false, error: 'Forbidden: Admins cannot change owner or admin roles.' }
      }
      if (input.newRole === 'owner' || input.newRole === 'admin') {
        return { success: false, error: 'Forbidden: Admins cannot promote members to admin or owner.' }
      }
    }

    // Prevent demoting the last owner of the organization
    if (targetMember.role === 'owner' && input.newRole !== 'owner') {
      const ownerCountRes = await queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1 AND role = 'owner'",
        [session.organization.id]
      )
      const ownerCount = parseInt(ownerCountRes?.count || '0', 10)

      if (ownerCount <= 1) {
        return { success: false, error: 'Cannot demote the last owner of an organization.' }
      }
    }

    // Update member role
    await query(
      `UPDATE organization_members
       SET role = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3`,
      [input.newRole, input.memberId, session.organization.id]
    )

    // Audit log
    await logAuditEvent({
      actorId: session.user.id,
      action: 'TEAM_MEMBER_ROLE_UPDATED',
      targetType: 'organization_member',
      targetId: input.memberId,
      details: { oldRole: targetMember.role, newRole: input.newRole },
    })

    // Transactional email notification to the member (Prompt 30 & 36)
    try {
      const targetUser = await queryOne<{ email: string; full_name?: string }>(
        'SELECT email, full_name FROM users WHERE id = $1',
        [targetMember.user_id]
      )

      if (targetUser?.email) {
        const emailTemplate = renderRoleChangedEmail({
          organizationName: session.organization.name,
          newRole: input.newRole,
          memberName: targetUser.full_name || undefined,
        })
        await sendEmail({
          to: targetUser.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        })
      }
    } catch (emailErr) {
      console.warn('Role change email dispatch notice:', emailErr)
    }

    revalidatePath('/settings/team')
    return { success: true }
  } catch (err: any) {
    console.error('Error updating member role:', err)
    return { success: false, error: err.message || 'Role update failed' }
  }
}

/**
 * Server Action: Remove Member (Prompt 36)
 * Rules:
 * - Owner and admin can remove members, with confirm.
 * - Cannot remove the owner.
 * - Admin cannot remove owner or admin.
 * - Writes audit events.
 */
export async function removeMember(input: RemoveMemberInput) {
  const session = await getCurrentSessionContext()

  if (!session || !session.user || !session.organization) {
    return { success: false, error: 'Unauthorized: No active session.' }
  }

  const isOwner = session.role === 'owner' || session.isSuperAdmin
  const isAdmin = session.role === 'admin'

  if (!isOwner && !isAdmin) {
    return { success: false, error: 'Forbidden: Only owners and admins can remove team members.' }
  }

  try {
    // Fetch the target member record
    const targetMember = await queryOne<{ id: string; organization_id: string; user_id: string; role: string }>(
      'SELECT id, organization_id, user_id, role FROM organization_members WHERE id = $1 AND organization_id = $2',
      [input.memberId, session.organization.id]
    )

    if (!targetMember) {
      return { success: false, error: 'Target member record not found.' }
    }

    // Rule: Cannot remove the owner
    if (targetMember.role === 'owner') {
      return { success: false, error: 'Cannot remove the organization owner.' }
    }

    // Rule: Admin cannot remove other admins
    if (isAdmin && targetMember.role === 'admin') {
      return { success: false, error: 'Forbidden: Admins cannot remove other admins.' }
    }

    // Delete member record (seat count drops automatically)
    await query(
      'DELETE FROM organization_members WHERE id = $1 AND organization_id = $2',
      [input.memberId, session.organization.id]
    )

    await logAuditEvent({
      actorId: session.user.id,
      action: 'TEAM_MEMBER_REMOVED',
      targetType: 'organization_member',
      targetId: input.memberId,
      details: { removedUserId: targetMember.user_id, role: targetMember.role },
    })

    revalidatePath('/settings/team')
    return { success: true }
  } catch (err: any) {
    console.error('Error removing org member:', err)
    return { success: false, error: err.message || 'Remove member failed' }
  }
}
