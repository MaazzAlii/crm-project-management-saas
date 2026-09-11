'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'

export interface UpdateOrgProfileInput {
  organizationId: string
  name: string
  industryType: string
  logoUrl?: string
  timezone?: string
}

export interface InviteMemberInput {
  email: string
  role: 'owner' | 'admin' | 'member' | 'billing_manager'
}

export interface UpdateRoleInput {
  memberId: string
  newRole: 'owner' | 'admin' | 'member' | 'billing_manager'
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

  const supabase = await createClient()

  const { error } = await supabase
    .from('organizations')
    .update({
      name: input.name,
      industry_type: input.industryType,
      logo_url: input.logoUrl || null,
      timezone: input.timezone || 'UTC',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.organizationId)

  if (error) {
    console.error('Error updating organization profile:', error)
    return { success: false, error: error.message }
  }

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

  const supabase = await createClient()

  // 1. Check if user profile already exists with this email
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', cleanEmail)
    .maybeSingle()

  if (existingProfile) {
    // Check if user is already a member of this organization
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', session.organization.id)
      .eq('user_id', existingProfile.id)
      .maybeSingle()

    if (existingMember) {
      return { success: false, error: 'This user is already a member of your organization.' }
    }

    // Add existing profile user as an org member
    const { error: insertError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: session.organization.id,
        user_id: existingProfile.id,
        role: input.role,
        invited_by: session.user.id,
      })

    if (insertError) {
      console.error('Error inserting org member:', insertError)
      return { success: false, error: insertError.message }
    }
  } else {
    // Stub invite logging for user not yet registered
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
  return { success: true, message: existingProfile ? 'Member added successfully!' : `Invitation email stubbed for ${cleanEmail}` }
}

/**
 * Server Action: Update Member Role
 * Restricted to 'owner' or 'admin' roles. Cannot demote the last owner.
 */
export async function updateMemberRole(input: UpdateRoleInput) {
  const session = await getCurrentSessionContext()

  if (!session || !session.user || !session.organization) {
    return { success: false, error: 'Unauthorized: No active session.' }
  }

  // Server-side Role Check
  if (session.role !== 'owner' && session.role !== 'admin' && !session.isSuperAdmin) {
    return { success: false, error: 'Forbidden: Only owners and admins can update member roles.' }
  }

  const supabase = await createClient()

  // Fetch the target member record
  const { data: targetMember } = await supabase
    .from('organization_members')
    .select('id, organization_id, user_id, role')
    .eq('id', input.memberId)
    .eq('organization_id', session.organization.id)
    .maybeSingle()

  if (!targetMember) {
    return { success: false, error: 'Target member record not found.' }
  }

  // Prevent demoting the last owner of the organization
  if (targetMember.role === 'owner' && input.newRole !== 'owner') {
    const { count: ownerCount } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', session.organization.id)
      .eq('role', 'owner')

    if (ownerCount !== null && ownerCount <= 1) {
      return { success: false, error: 'Cannot demote the last owner of an organization.' }
    }
  }

  // Update member role
  const { error: updateError } = await supabase
    .from('organization_members')
    .update({
      role: input.newRole,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.memberId)
    .eq('organization_id', session.organization.id)

  if (updateError) {
    console.error('Error updating member role:', updateError)
    return { success: false, error: updateError.message }
  }

  await logAuditEvent({
    actorId: session.user.id,
    action: 'TEAM_MEMBER_ROLE_UPDATED',
    targetType: 'organization_member',
    targetId: input.memberId,
    details: { oldRole: targetMember.role, newRole: input.newRole },
  })

  revalidatePath('/settings/team')
  return { success: true }
}

/**
 * Server Action: Remove Member
 * Restricted to 'owner' or 'admin' roles. Cannot remove the last owner.
 */
export async function removeMember(input: RemoveMemberInput) {
  const session = await getCurrentSessionContext()

  if (!session || !session.user || !session.organization) {
    return { success: false, error: 'Unauthorized: No active session.' }
  }

  // Server-side Role Check
  if (session.role !== 'owner' && session.role !== 'admin' && !session.isSuperAdmin) {
    return { success: false, error: 'Forbidden: Only owners and admins can remove team members.' }
  }

  const supabase = await createClient()

  // Fetch the target member record
  const { data: targetMember } = await supabase
    .from('organization_members')
    .select('id, organization_id, user_id, role')
    .eq('id', input.memberId)
    .eq('organization_id', session.organization.id)
    .maybeSingle()

  if (!targetMember) {
    return { success: false, error: 'Target member record not found.' }
  }

  // Prevent removing the last owner of the organization
  if (targetMember.role === 'owner') {
    const { count: ownerCount } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', session.organization.id)
      .eq('role', 'owner')

    if (ownerCount !== null && ownerCount <= 1) {
      return { success: false, error: 'Cannot remove the last owner of an organization.' }
    }
  }

  // Delete member record
  const { error: deleteError } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', input.memberId)
    .eq('organization_id', session.organization.id)

  if (deleteError) {
    console.error('Error removing org member:', deleteError)
    return { success: false, error: deleteError.message }
  }

  await logAuditEvent({
    actorId: session.user.id,
    action: 'TEAM_MEMBER_REMOVED',
    targetType: 'organization_member',
    targetId: input.memberId,
    details: { removedUserId: targetMember.user_id, role: targetMember.role },
  })

  revalidatePath('/settings/team')
  return { success: true }
}
