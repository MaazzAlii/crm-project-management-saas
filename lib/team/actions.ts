'use server'

import { query, queryOne } from '@/lib/db'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'
import { canInviteWithRole, OrgRole } from '@/lib/auth/permissions'
import { orgService } from '@/lib/services/org-service'

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
  confirmOrgName?: string
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
 * Enforces centralized RBAC permissions.
 */
export async function inviteTeamMember(input: InviteMemberInput) {
  const session = await getCurrentSessionContext()

  if (!session || !session.user || !session.organization) {
    return { success: false, error: 'Unauthorized: No active session.' }
  }

  // Enforce centralized permission check
  const perm = canInviteWithRole(
    {
      userId: session.user.id,
      role: session.role as OrgRole,
      orgId: session.organization.id,
      isSuperAdmin: session.isSuperAdmin,
    },
    input.role
  )

  if (!perm.allowed) {
    return {
      success: false,
      error: perm.message || 'Forbidden: Insufficient role permissions.',
      code: perm.code,
      requiredRole: perm.requiredRole,
      yourRole: perm.yourRole,
    }
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
 * Server Action: Update Member Role (Prompt 36 & TEAM-3 Hardening)
 * Calls orgService.updateMemberRole to ensure atomic transaction and FOR UPDATE concurrency lock.
 */
export async function updateMemberRole(input: UpdateRoleInput) {
  const session = await getCurrentSessionContext()

  if (!session || !session.user || !session.organization) {
    return { success: false, error: 'Unauthorized: No active session.' }
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

    // Call atomic transactional orgService
    await orgService.updateMemberRole(
      session.organization.id,
      session.user.id,
      targetMember.user_id,
      input.newRole,
      session.isSuperAdmin
    )

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
    return {
      success: false,
      error: err.message || 'Role update failed',
      code: err.code,
      requiredRole: err.details?.requiredRole,
      yourRole: err.details?.yourRole,
    }
  }
}

/**
 * Server Action: Remove Member (Prompt 36 & TEAM-3 Hardening)
 * Calls orgService.removeMember to ensure atomic transaction and FOR UPDATE concurrency lock.
 */
export async function removeMember(input: RemoveMemberInput) {
  const session = await getCurrentSessionContext()

  if (!session || !session.user || !session.organization) {
    return { success: false, error: 'Unauthorized: No active session.' }
  }

  // Guardrail 2: Destructive actions while impersonating require typed organization name confirmation
  if (session.impersonation?.isImpersonated) {
    const { assertDestructiveActionAllowed } = await import('@/lib/auth/impersonation')
    try {
      assertDestructiveActionAllowed(session, input.confirmOrgName)
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        code: 'TYPED_CONFIRMATION_REQUIRED',
        status: 400,
      }
    }
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

    // Call atomic transactional orgService
    await orgService.removeMember(
      session.organization.id,
      session.user.id,
      targetMember.user_id,
      session.isSuperAdmin
    )

    revalidatePath('/settings/team')
    return { success: true }
  } catch (err: any) {
    if (err?.code === 'TYPED_CONFIRMATION_REQUIRED') {
      return {
        success: false,
        error: err.message,
        code: 'TYPED_CONFIRMATION_REQUIRED',
        status: 400,
      }
    }
    console.error('Error removing org member:', err)
    return {
      success: false,
      error: err.message || 'Remove member failed',
      code: err.code,
      requiredRole: err.details?.requiredRole,
      yourRole: err.details?.yourRole,
    }
  }
}
