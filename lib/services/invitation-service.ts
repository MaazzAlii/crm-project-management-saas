/**
 * =============================================================================
 * Innoventix Platform — Invitation Service
 * =============================================================================
 * Handles organization invitation lifecycle, seat limit enforcement,
 * RBAC authorization, cryptographic tokens, and multi-tenant audit trail.
 * =============================================================================
 */

import { queryOne, transaction } from '../db';
import { invitationRepo } from '../db/repositories/invitation-repo';
import { orgRepo } from '../db/repositories/org-repo';
import { userRepo } from '../db/repositories/user-repo';
import { getCurrentPlan } from '../billing/current-plan';
import { checkMemberLimit, checkPendingInviteLimit } from './plan-limits';
import { normalizeEmail, isValidEmail } from '../validation/email';
import { generateToken, hashToken } from '../security/invite-token';
import { logInvitationAudit } from '../audit/invitations';
import { canResend, canRevoke } from '../invitations/status';
import { sendEmail } from '../email/sender';
import { renderInviteEmail } from '../email/templates';
import { hashPassword, validatePasswordStrength } from '../auth/password';
import { canInviteWithRole, OrgRole } from '../auth/permissions';
import { Invitation, InvitationRole } from '../types/database';

export interface InvitationSessionContext {
  userId?: string | null;
  orgId?: string | null;
  email?: string | null;
  user?: {
    id: string;
    email?: string;
  } | null;
  role?: string | null;
  isSuperAdmin?: boolean;
}

export interface CreateInvitationInput {
  email: string;
  role: InvitationRole;
  password?: string;
}

export interface CreateInvitationSuccess {
  success: true;
  invitation: Invitation;
  rawToken?: string;
  alreadyPending?: boolean;
  sendFailed?: boolean;
  warning?: string;
}

export interface CreateInvitationError {
  success: false;
  error: 'unauthorized' | 'forbidden' | 'invalid_email' | 'invalid_password' | 'already_member' | 'LIMIT_REACHED';
  code?: 'SEAT_LIMIT_REACHED' | 'PENDING_LIMIT_REACHED' | 'INSUFFICIENT_ROLE';
  reason?: 'MEMBER_LIMIT' | 'PENDING_LIMIT';
  message: string;
  status: number;
  planName?: string;
  limit?: number;
  current?: number;
  currentCount?: number;
  upgradeUrl?: string;
  requiredRole?: string;
  yourRole?: string;
}

export type CreateInvitationResult = CreateInvitationSuccess | CreateInvitationError;

/**
 * Creates a new organization invitation enforcing the 10 sequential domain rules:
 * 1. Require authenticated session.
 * 2. Only owner or admin may invite.
 * 3. Admin cannot invite another admin or owner. Only owner can invite admin.
 * 4. Normalize and validate the email address.
 * 5. Reject if email belongs to an existing member.
 * 6. Return existing record with alreadyPending=true if invite is already pending.
 * 7. Enforce plan maxMembers seat quota.
 * 8. Enforce plan maxPendingInvites quota.
 * 9. Cryptographically generate token, hash, store, and record audit event.
 * 10. Attempt transactional email dispatch; retain row and warn if delivery fails.
 */
export async function createInvitation(
  session: InvitationSessionContext | null | undefined,
  input: CreateInvitationInput
): Promise<CreateInvitationResult> {
  // 1. Require an authenticated session
  const actorUserId = session?.userId || session?.user?.id;
  const orgId = session?.orgId;

  if (!session || !actorUserId || !orgId) {
    return {
      success: false,
      error: 'unauthorized',
      status: 401,
      message: 'Authentication and active organization context required',
    };
  }

  // 2. Centralized RBAC check: Only owner or admin may invite, with role hierarchy
  const actorRole = (await orgRepo.getMemberRole(orgId, actorUserId)) as OrgRole;
  if (!actorRole) {
    return {
      success: false,
      error: 'forbidden',
      status: 403,
      code: 'INSUFFICIENT_ROLE',
      message: 'Forbidden: You are not a member of this organization',
    };
  }

  const perm = canInviteWithRole(
    {
      userId: actorUserId,
      role: actorRole,
      orgId,
      isSuperAdmin: session?.isSuperAdmin,
    },
    input.role as OrgRole
  );

  if (!perm.allowed) {
    return {
      success: false,
      error: 'forbidden',
      status: 403,
      code: perm.code as any,
      message: perm.message || 'Forbidden: Insufficient role permissions.',
      requiredRole: perm.requiredRole,
      yourRole: perm.yourRole,
    };
  }

  // 4. Normalize and validate the email (Prompt 16)
  const normalizedEmail = normalizeEmail(input.email);
  if (!isValidEmail(normalizedEmail)) {
    return {
      success: false,
      error: 'invalid_email',
      status: 400,
      message: 'Invalid email address provided',
    };
  }

  // 5. Check if the email already belongs to a member of this organization
  const existingMember = await queryOne<{ id: string }>(
    `SELECT m.id 
     FROM organization_members m
     JOIN users u ON m.user_id = u.id
     WHERE m.organization_id = $1 
       AND lower(trim(u.email)) = $2`,
    [orgId, normalizedEmail]
  );

  if (existingMember) {
    return {
      success: false,
      error: 'already_member',
      status: 409,
      message: 'This email already belongs to a member of this organization',
    };
  }

  // 6. If a pending invite exists for this email, return it with alreadyPending flag
  const existingPending = await invitationRepo.findPendingByEmail(orgId, normalizedEmail);
  if (existingPending) {
    return {
      success: true,
      invitation: existingPending,
      alreadyPending: true,
    };
  }

  // 7. Check maxPendingInvites
  const pendingCheck = await checkPendingInviteLimit(orgId);
  if (!pendingCheck.allowed) {
    return {
      success: false,
      error: 'LIMIT_REACHED',
      code: 'PENDING_LIMIT_REACHED',
      reason: 'PENDING_LIMIT',
      status: 402,
      message: pendingCheck.message || `Pending invitations limit reached for ${pendingCheck.planName} plan (${pendingCheck.limit} pending)`,
      planName: pendingCheck.planName,
      limit: pendingCheck.limit,
      current: pendingCheck.currentCount,
      currentCount: pendingCheck.currentCount,
      upgradeUrl: pendingCheck.upgradeUrl,
    };
  }

  // 8. Check seats: countSeatsUsed + 1 must not exceed the plan's maxMembers
  const memberCheck = await checkMemberLimit(orgId, { isInviteCreation: true });
  if (!memberCheck.allowed) {
    return {
      success: false,
      error: 'LIMIT_REACHED',
      code: 'SEAT_LIMIT_REACHED',
      reason: 'MEMBER_LIMIT',
      status: 402,
      message: memberCheck.message || `Seat limit reached for ${memberCheck.planName} plan (${memberCheck.limit} seats)`,
      planName: memberCheck.planName,
      limit: memberCheck.limit,
      current: memberCheck.currentCount,
      currentCount: memberCheck.currentCount,
      upgradeUrl: memberCheck.upgradeUrl,
    };
  }

  // 9. If temporary password provided, validate strength and hash
  let tempPasswordHash: string | null = null;
  let requirePasswordChange = false;
  if (input.password) {
    const passwordCheck = validatePasswordStrength(input.password);
    if (!passwordCheck.isValid) {
      return {
        success: false,
        error: 'invalid_password',
        status: 400,
        message: passwordCheck.errors.join('. '),
      };
    }
    tempPasswordHash = await hashPassword(input.password);
    requirePasswordChange = true;
  }

  // Generate token, store hash, expires_at now plus 7 days, write audit event
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await invitationRepo.insertInvitation(orgId, {
    email: normalizedEmail,
    role: input.role,
    tokenHash,
    invitedBy: actorUserId,
    expiresAt,
    tempPasswordHash,
    requirePasswordChange,
  });

  // Write immutable audit event
  await logInvitationAudit({
    action: 'invite.created',
    organizationId: orgId,
    actorId: actorUserId,
    targetEmail: normalizedEmail,
    role: input.role,
    details: {
      invitationId: invitation.id,
      role: input.role,
      expiresAt: invitation.expires_at,
    },
  });

  // 10. Send the email. If sending fails, retain the invite row with send_failed flag
  let sendWarning: string | undefined;
  let sendFailed = false;

  try {
    const org = await orgRepo.findById(orgId);
    const inviter = await userRepo.findById(actorUserId);
    const emailTemplate = renderInviteEmail({
      inviterName: (inviter as any)?.full_name || (inviter as any)?.name || 'A team member',
      organizationName: org?.name || 'Your organization',
      role: input.role,
      rawToken,
      expiresAt,
      inviterEmail: inviter?.email,
      inviterEmailVerified: (inviter as any)?.email_verified ?? false,
    });

    const sendRes = await sendEmail({
      to: normalizedEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      displayName: emailTemplate.displayName,
      replyTo: emailTemplate.replyTo,
    });

    if (!sendRes.success) {
      throw new Error(sendRes.error || 'Failed to dispatch email');
    }
  } catch (error: any) {
    console.warn(`[INVITATION_EMAIL_FAILED] Failed to send email to ${normalizedEmail}:`, error);
    sendFailed = true;
    sendWarning = 'Invitation created, but notification email could not be delivered.';
    await invitationRepo.markSendFailed(orgId, invitation.id, true);
    invitation.send_failed = true;
    await logInvitationAudit({
      action: 'invite.send_failed',
      organizationId: orgId,
      actorId: actorUserId,
      targetEmail: normalizedEmail,
      role: input.role,
      details: {
        invitationId: invitation.id,
        error: error?.message || String(error),
      },
    });
  }

  return {
    success: true,
    invitation,
    rawToken,
    sendFailed,
    warning: sendWarning,
  };
}

export interface ResendInvitationSuccess {
  success: true;
  invitation: Invitation;
  rawToken: string;
  sendFailed?: boolean;
  warning?: string;
}

export interface ResendInvitationError {
  success: false;
  error: 'unauthorized' | 'forbidden' | 'not_found' | 'invalid_status';
  status: number;
  message: string;
}

export type ResendInvitationResult = ResendInvitationSuccess | ResendInvitationError;

/**
 * Resends an existing invitation:
 * - Requires owner or admin permissions.
 * - Enforces allowed states from Prompt 07 (pending or expired).
 * - Replaces old token hash so previous invitation links immediately stop working.
 * - Resets expiry to 7 days from now.
 * - Writes invite.resent audit event.
 */
export async function resendInvitation(
  session: InvitationSessionContext | null | undefined,
  inviteId: string
): Promise<ResendInvitationResult> {
  const actorUserId = session?.userId || session?.user?.id;
  const orgId = session?.orgId;

  if (!session || !actorUserId || !orgId) {
    return {
      success: false,
      error: 'unauthorized',
      status: 401,
      message: 'Authentication and active organization context required',
    };
  }

  const actorRole = await orgRepo.getMemberRole(orgId, actorUserId);
  if (!actorRole || (actorRole !== 'owner' && actorRole !== 'admin')) {
    return {
      success: false,
      error: 'forbidden',
      status: 403,
      message: 'Forbidden: Only organization owners and admins can resend invitations',
    };
  }

  const invite = await invitationRepo.findById(orgId, inviteId);
  if (!invite) {
    return {
      success: false,
      error: 'not_found',
      status: 404,
      message: 'Invitation not found in this organization',
    };
  }

  if (!canResend(invite)) {
    return {
      success: false,
      error: 'invalid_status',
      status: 400,
      message: `Cannot resend invitation with status ${invite.status}`,
    };
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const updated = await invitationRepo.updateTokenAndExpiry(orgId, inviteId, tokenHash, expiresAt);
  if (!updated) {
    return {
      success: false,
      error: 'not_found',
      status: 404,
      message: 'Invitation not found in this organization',
    };
  }

  // Audit event
  await logInvitationAudit({
    action: 'invite.resent',
    organizationId: orgId,
    actorId: actorUserId,
    targetEmail: updated.email,
    role: updated.role,
    details: {
      invitationId: updated.id,
      expiresAt: updated.expires_at,
    },
  });

  let sendFailed = false;
  let sendWarning: string | undefined;

  try {
    const org = await orgRepo.findById(orgId);
    const inviter = await userRepo.findById(actorUserId);
    const emailTemplate = renderInviteEmail({
      inviterName: (inviter as any)?.full_name || (inviter as any)?.name || 'A team member',
      organizationName: org?.name || 'Your organization',
      role: updated.role,
      rawToken,
      expiresAt,
      inviterEmail: inviter?.email,
      inviterEmailVerified: (inviter as any)?.email_verified ?? false,
    });

    const sendRes = await sendEmail({
      to: updated.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      displayName: emailTemplate.displayName,
      replyTo: emailTemplate.replyTo,
    });

    if (!sendRes.success) {
      throw new Error(sendRes.error || 'Failed to dispatch email');
    }
  } catch (error: any) {
    console.warn(`[INVITATION_RESEND_FAILED] Failed to resend email to ${updated.email}:`, error);
    sendFailed = true;
    sendWarning = 'Invitation refreshed, but notification email could not be delivered.';
    await invitationRepo.markSendFailed(orgId, updated.id, true);
    updated.send_failed = true;
    await logInvitationAudit({
      action: 'invite.send_failed',
      organizationId: orgId,
      actorId: actorUserId,
      targetEmail: updated.email,
      role: updated.role,
      details: {
        invitationId: updated.id,
        error: error?.message || String(error),
      },
    });
  }

  return {
    success: true,
    invitation: updated,
    rawToken,
    sendFailed,
    warning: sendWarning,
  };
}

export interface RevokeInvitationSuccess {
  success: true;
  invitation: Invitation;
}

export interface RevokeInvitationError {
  success: false;
  error: 'unauthorized' | 'forbidden' | 'not_found' | 'invalid_status';
  status: number;
  message: string;
}

export type RevokeInvitationResult = RevokeInvitationSuccess | RevokeInvitationError;

/**
 * Revokes a pending invitation:
 * - Requires owner or admin permissions.
 * - Only pending invitations may be revoked.
 * - Sets status=revoked and revoked_at=now so the link stops working immediately.
 * - Writes invite.revoked audit event.
 */
export async function revokeInvitation(
  session: InvitationSessionContext | null | undefined,
  inviteId: string
): Promise<RevokeInvitationResult> {
  const actorUserId = session?.userId || session?.user?.id;
  const orgId = session?.orgId;

  if (!session || !actorUserId || !orgId) {
    return {
      success: false,
      error: 'unauthorized',
      status: 401,
      message: 'Authentication and active organization context required',
    };
  }

  const actorRole = await orgRepo.getMemberRole(orgId, actorUserId);
  if (!actorRole || (actorRole !== 'owner' && actorRole !== 'admin')) {
    return {
      success: false,
      error: 'forbidden',
      status: 403,
      message: 'Forbidden: Only organization owners and admins can revoke invitations',
    };
  }

  const invite = await invitationRepo.findById(orgId, inviteId);
  if (!invite) {
    return {
      success: false,
      error: 'not_found',
      status: 404,
      message: 'Invitation not found in this organization',
    };
  }

  if (!canRevoke(invite)) {
    return {
      success: false,
      error: 'invalid_status',
      status: 400,
      message: `Only pending invitations can be revoked. Current status is ${invite.status}.`,
    };
  }

  const updated = await invitationRepo.updateStatus(orgId, inviteId, {
    status: 'revoked',
    revokedAt: new Date(),
  });

  if (!updated) {
    return {
      success: false,
      error: 'not_found',
      status: 404,
      message: 'Invitation not found in this organization',
    };
  }

  // Audit event
  await logInvitationAudit({
    action: 'invite.revoked',
    organizationId: orgId,
    actorId: actorUserId,
    targetEmail: updated.email,
    role: updated.role,
    details: {
      invitationId: updated.id,
      revokedAt: updated.revoked_at,
    },
  });

  return {
    success: true,
    invitation: updated,
  };
}

export interface AcceptInvitationSuccess {
  success: true;
  invitation: Invitation;
  organizationId: string;
  role: string;
}

export interface AcceptInvitationNeedsAccount {
  success: false;
  error: 'needs_account';
  needsAccount: true;
  status: 401;
  email: string;
  organizationId: string;
  role: string;
  message: string;
}

export interface AcceptInvitationWrongAccount {
  success: false;
  error: 'wrong_account';
  status: 403;
  expectedEmail: string;
  currentEmail: string;
  message: string;
}

export interface AcceptInvitationGeneralError {
  success: false;
  error: 'invalid_or_expired' | 'expired' | 'revoked' | 'already_accepted' | 'seat_limit_reached';
  code?: 'SEAT_LIMIT_REACHED';
  status: number;
  message: string;
  currentCount?: number;
  limit?: number;
  planName?: string;
  upgradeUrl?: string;
}

export type AcceptInvitationResult =
  | AcceptInvitationSuccess
  | AcceptInvitationNeedsAccount
  | AcceptInvitationWrongAccount
  | AcceptInvitationGeneralError;

/**
 * Accepts an invitation using a raw plaintext token:
 * 1. Hashes token and finds the invitation (unscoped). Invalid/not found returns invalid_or_expired.
 * 2. Checks status: revoked, already accepted, or expired returns matching error.
 * 3. If there is no session: returns needsAccount with invited email so UI locks email input.
 * 4. If session exists: enforces email matches the invitation email (case-insensitive); else wrongAccount.
 * 5. Adds the user to organization_members with the invited role and marks invitation accepted in one transaction.
 * 6. If already a member: marks invitation accepted and succeeds without duplicate errors.
 * 7. Writes invite.accepted audit log.
 */
export async function acceptInvitation(
  rawToken: string,
  session: InvitationSessionContext | null | undefined
): Promise<AcceptInvitationResult> {
  if (!rawToken || typeof rawToken !== 'string') {
    return {
      success: false,
      error: 'invalid_or_expired',
      status: 400,
      message: 'This invitation is invalid or has expired',
    };
  }

  const tokenHash = hashToken(rawToken);
  const invite = await invitationRepo.findByTokenHash(tokenHash);

  // 1. Not found returns invalid_or_expired (same as expired so attackers cannot tell)
  if (!invite) {
    return {
      success: false,
      error: 'invalid_or_expired',
      status: 400,
      message: 'This invitation is invalid or has expired',
    };
  }

  // 2. Status checks
  if (invite.status === 'revoked' || invite.revoked_at) {
    return {
      success: false,
      error: 'revoked',
      status: 400,
      message: 'This invitation has been revoked',
    };
  }

  if (invite.status === 'accepted' || invite.accepted_at) {
    return {
      success: false,
      error: 'already_accepted',
      status: 400,
      message: 'This invitation has already been accepted',
    };
  }

  const now = new Date();
  if (new Date(invite.expires_at) <= now || invite.status === 'expired') {
    return {
      success: false,
      error: 'expired',
      status: 410,
      message: 'This invitation has expired. Invitations are valid for 7 days. Please request a new invitation from your workspace administrator.',
    };
  }

  // 3. If there is no session: return needsAccount
  const actorUserId = session?.userId || session?.user?.id;
  if (!session || !actorUserId) {
    return {
      success: false,
      error: 'needs_account',
      needsAccount: true,
      status: 401,
      email: invite.email.toLowerCase(),
      organizationId: invite.organization_id,
      role: invite.role,
      message: 'Authentication required. Please sign up or log in with the invited email address.',
    };
  }

  // 4. If session exists: enforce email match
  let userEmail = session.email || session.user?.email;
  if (!userEmail) {
    const user = await userRepo.findById(actorUserId);
    userEmail = user?.email;
  }

  if (!userEmail || normalizeEmail(userEmail) !== normalizeEmail(invite.email)) {
    return {
      success: false,
      error: 'wrong_account',
      status: 403,
      expectedEmail: invite.email.toLowerCase(),
      currentEmail: (userEmail || '').toLowerCase(),
      message: 'Logged in with the wrong account. Please switch to the account associated with this invitation.',
    };
  }

  // 5 & 6. Transaction: lock invitation, add member, mark accepted
  const txResult = await transaction(async (client) => {
    const lockedRes = await client.query<Invitation>(
      `SELECT * FROM invitations WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
      [invite.id, invite.organization_id]
    );
    const locked = lockedRes.rows[0];
    if (!locked) {
      throw new Error('INVITATION_NOT_FOUND');
    }

    if (locked.status === 'accepted' || locked.accepted_at) {
      return { error: 'already_accepted' as const, invitation: locked };
    }
    if (locked.status === 'revoked' || locked.revoked_at) {
      return { error: 'revoked' as const, invitation: locked };
    }
    if (new Date(locked.expires_at) <= new Date()) {
      return { error: 'invalid_or_expired' as const, invitation: locked };
    }

    // Check if user is ALREADY a member
    const existingMemberRes = await client.query(
      `SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
      [locked.organization_id, actorUserId]
    );

    // If NOT already a member, check if organization seat limit is reached!
    if (existingMemberRes.rows.length === 0) {
      const memberLimit = await checkMemberLimit(locked.organization_id, { client });
      if (!memberLimit.allowed) {
        return {
          error: 'seat_limit_reached' as const,
          maxMembers: memberLimit.limit,
          currentCount: memberLimit.currentCount,
          planName: memberLimit.planName,
          upgradeUrl: memberLimit.upgradeUrl,
          invitation: locked,
        };
      }
    }

    // Insert into organization_members (idempotent with ON CONFLICT)
    await client.query(
      `INSERT INTO organization_members (organization_id, user_id, role, invited_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [locked.organization_id, actorUserId, locked.role, locked.invited_by || null]
    );

    // If invitation required password change, enforce on user account
    if (locked.require_password_change) {
      await client.query(
        `UPDATE users SET require_password_change = true WHERE id = $1`,
        [actorUserId]
      );
    }

    // Mark invitation accepted
    const updatedRes = await client.query<Invitation>(
      `UPDATE invitations
       SET 
         status = 'accepted',
         accepted_at = NOW(),
         accepted_by = $1,
         updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [actorUserId, locked.id, locked.organization_id]
    );

    return { error: null, invitation: updatedRes.rows[0] };
  });

  if (txResult.error === 'seat_limit_reached') {
    return {
      success: false,
      error: 'seat_limit_reached',
      code: 'SEAT_LIMIT_REACHED',
      status: 403,
      currentCount: txResult.currentCount,
      limit: txResult.maxMembers,
      planName: txResult.planName,
      upgradeUrl: txResult.upgradeUrl || '/settings/billing',
      message: `${txResult.planName} plan allows up to ${txResult.maxMembers} team members. Upgrade to invite more.`,
    };
  }
  if (txResult.error === 'already_accepted') {
    return {
      success: false,
      error: 'already_accepted',
      status: 400,
      message: 'This invitation has already been accepted',
    };
  }
  if (txResult.error === 'revoked') {
    return {
      success: false,
      error: 'revoked',
      status: 400,
      message: 'This invitation has been revoked',
    };
  }
  if (txResult.error === 'invalid_or_expired') {
    return {
      success: false,
      error: 'invalid_or_expired',
      status: 400,
      message: 'This invitation is invalid or has expired',
    };
  }

  // 7. Write invite.accepted audit log
  await logInvitationAudit({
    action: 'invite.accepted',
    organizationId: invite.organization_id,
    actorId: actorUserId,
    targetEmail: invite.email,
    role: invite.role,
    details: {
      invitationId: invite.id,
    },
  });

  return {
    success: true,
    invitation: txResult.invitation,
    organizationId: invite.organization_id,
    role: invite.role,
  };
}

export interface InvitationAcceptInfoSuccess {
  success: true;
  organizationName: string;
  organizationSlug?: string;
  domain: string;
  maskedEmail: string;
  accountExists: boolean;
  role: string;
}

export interface InvitationAcceptInfoError {
  success: false;
  error: 'invalid_or_expired' | 'expired';
  status: number;
  message: string;
}

export type InvitationAcceptInfoResult = InvitationAcceptInfoSuccess | InvitationAcceptInfoError;

/**
 * Returns masked metadata for the unauthenticated invite acceptance screen:
 * - Never reveals full email address (masks local part).
 * - Reveals organization name and domain.
 * - Indicates if account exists in database for this email.
 * - Returns generic invalid_or_expired on invalid or expired token.
 */
export async function getInvitationAcceptInfo(
  rawToken: string
): Promise<InvitationAcceptInfoResult> {
  if (!rawToken || typeof rawToken !== 'string') {
    return {
      success: false,
      error: 'invalid_or_expired',
      status: 400,
      message: 'This invitation is invalid or has expired',
    };
  }

  const tokenHash = hashToken(rawToken);
  const invite = await invitationRepo.findByTokenHash(tokenHash);

  if (!invite) {
    return {
      success: false,
      error: 'invalid_or_expired',
      status: 400,
      message: 'This invitation is invalid or has expired',
    };
  }

  // Check if invitation is expired (7 days)
  if (invite.status === 'expired' || new Date(invite.expires_at) <= new Date()) {
    return {
      success: false,
      error: 'expired',
      status: 410,
      message: 'This invitation has expired. Invitations are valid for 7 days. Please request a new invitation from your workspace administrator.',
    };
  }

  // Check if invitation is revoked, accepted, or declined
  if (
    invite.status === 'revoked' ||
    invite.revoked_at ||
    invite.status === 'accepted' ||
    invite.accepted_at ||
    invite.status === 'declined' ||
    invite.declined_at
  ) {
    return {
      success: false,
      error: 'invalid_or_expired',
      status: 400,
      message: 'This invitation is invalid or has expired',
    };
  }

  const org = await orgRepo.findById(invite.organization_id);
  const existingUser = await userRepo.findByEmail(invite.email);

  // Mask email: e.g. "john.doe@example.com" -> "j***@example.com"
  const atIndex = invite.email.indexOf('@');
  const localPart = atIndex > 0 ? invite.email.slice(0, atIndex) : '';
  const domain = atIndex > 0 ? invite.email.slice(atIndex + 1) : '';
  const firstChar = localPart.length > 0 ? localPart[0] : '';
  const maskedEmail = `${firstChar}***@${domain}`;

  return {
    success: true,
    organizationName: org?.name || 'Innoventix Workspace',
    organizationSlug: org?.slug,
    domain,
    maskedEmail,
    accountExists: !!existingUser,
    role: invite.role,
  };
}

export interface DeclineInvitationSuccess {
  success: true;
  invitation: Invitation;
}

export interface DeclineInvitationError {
  success: false;
  error: 'invalid_or_expired' | 'invalid_status';
  status: number;
  message: string;
}

export type DeclineInvitationResult = DeclineInvitationSuccess | DeclineInvitationError;

/**
 * Declines an invitation by token:
 * - Only pending invitations may be declined.
 * - Sets status=declined and declined_at=now.
 * - Writes invite.declined audit event.
 */
export async function declineInvitation(
  rawToken: string
): Promise<DeclineInvitationResult> {
  if (!rawToken || typeof rawToken !== 'string') {
    return {
      success: false,
      error: 'invalid_or_expired',
      status: 400,
      message: 'This invitation is invalid or has expired',
    };
  }

  const tokenHash = hashToken(rawToken);
  const invite = await invitationRepo.findByTokenHash(tokenHash);

  if (!invite) {
    return {
      success: false,
      error: 'invalid_or_expired',
      status: 400,
      message: 'This invitation is invalid or has expired',
    };
  }

  if (new Date(invite.expires_at) <= new Date() || invite.status === 'expired') {
    return {
      success: false,
      error: 'invalid_or_expired',
      status: 400,
      message: 'This invitation is invalid or has expired',
    };
  }

  if (invite.status !== 'pending') {
    return {
      success: false,
      error: 'invalid_status',
      status: 400,
      message: `Cannot decline invitation that is currently ${invite.status}`,
    };
  }

  const updated = await invitationRepo.updateStatus(invite.organization_id, invite.id, {
    status: 'declined',
    declinedAt: new Date(),
  });

  if (!updated) {
    return {
      success: false,
      error: 'invalid_or_expired',
      status: 400,
      message: 'This invitation is invalid or has expired',
    };
  }

  // Audit event
  await logInvitationAudit({
    action: 'invite.declined',
    organizationId: invite.organization_id,
    targetEmail: updated.email,
    role: updated.role,
    details: {
      invitationId: updated.id,
      declinedAt: updated.declined_at,
    },
  });

  return {
    success: true,
    invitation: updated,
  };
}

