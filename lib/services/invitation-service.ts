/**
 * =============================================================================
 * Innoventix Platform — Invitation Service
 * =============================================================================
 * Handles organization invitation lifecycle, seat limit enforcement,
 * RBAC authorization, cryptographic tokens, and multi-tenant audit trail.
 * =============================================================================
 */

import { queryOne } from '../db';
import { invitationRepo } from '../db/repositories/invitation-repo';
import { orgRepo } from '../db/repositories/org-repo';
import { getCurrentPlan } from '../billing/current-plan';
import { normalizeEmail, isValidEmail } from '../validation/email';
import { generateToken, hashToken } from '../security/invite-token';
import { logInvitationAudit } from '../audit/invitations';
import { canResend, canRevoke } from '../invitations/status';
import { Invitation, InvitationRole } from '../types/database';

export interface InvitationSessionContext {
  userId?: string | null;
  orgId?: string | null;
  user?: {
    id: string;
    email?: string;
  } | null;
  role?: string | null;
}

export interface CreateInvitationInput {
  email: string;
  role: InvitationRole;
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
  error: 'unauthorized' | 'forbidden' | 'invalid_email' | 'already_member' | 'LIMIT_REACHED';
  message: string;
  status: number;
  planName?: string;
  limit?: number;
  current?: number;
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

  // 2. Only owner or admin may invite. Member and viewer get forbidden.
  const actorRole = await orgRepo.getMemberRole(orgId, actorUserId);
  if (!actorRole || (actorRole !== 'owner' && actorRole !== 'admin')) {
    return {
      success: false,
      error: 'forbidden',
      status: 403,
      message: 'Forbidden: Only organization owners and admins can send invitations',
    };
  }

  // 3. Admin cannot invite another admin or owner. Only owner can invite admin.
  if (actorRole === 'admin' && (input.role === 'admin' || (input.role as string) === 'owner')) {
    return {
      success: false,
      error: 'forbidden',
      status: 403,
      message: 'Forbidden: Admins cannot invite other admins or owners. Only owners can invite admins.',
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

  // Retrieve current subscription plan & seat rules
  const planInfo = await getCurrentPlan(orgId);
  const planConfig = planInfo.planConfig;

  // 7. Check maxPendingInvites
  const pendingCount = await invitationRepo.countPending(orgId);
  if (pendingCount >= planConfig.maxPendingInvites) {
    return {
      success: false,
      error: 'LIMIT_REACHED',
      status: 403,
      message: `Pending invitations limit reached for ${planConfig.name} plan (${planConfig.maxPendingInvites} pending)`,
      planName: planConfig.name,
      limit: planConfig.maxPendingInvites,
      current: pendingCount,
    };
  }

  // 8. Check seats: countSeatsUsed + 1 must not exceed the plan's maxMembers
  const seatsUsed = await orgRepo.countSeatsUsed(orgId);
  if (seatsUsed + 1 > planConfig.maxMembers) {
    return {
      success: false,
      error: 'LIMIT_REACHED',
      status: 403,
      message: `Seat limit reached for ${planConfig.name} plan (${planConfig.maxMembers} seats)`,
      planName: planConfig.name,
      limit: planConfig.maxMembers,
      current: seatsUsed,
    };
  }

  // 9. Generate token, store hash, expires_at now plus 7 days, write audit event
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await invitationRepo.insertInvitation(orgId, {
    email: normalizedEmail,
    role: input.role,
    tokenHash,
    invitedBy: actorUserId,
    expiresAt,
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

  // 10. Send the email (Prompt 29). If sending fails, retain the invite row with send_failed flag
  let sendWarning: string | undefined;
  let sendFailed = false;

  try {
    // Console / mock delivery until full abstraction in Prompt 29
    console.log(`[INVITATION_EMAIL_DISPATCH] To: ${normalizedEmail}, Org: ${orgId}, Token: [SECURE]`);
  } catch (error) {
    console.warn(`[INVITATION_EMAIL_FAILED] Failed to send email to ${normalizedEmail}:`, error);
    sendFailed = true;
    sendWarning = 'Invitation created, but notification email could not be delivered.';
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

  console.log(`[INVITATION_EMAIL_RESEND] To: ${updated.email}, Org: ${orgId}, Token: [SECURE]`);

  return {
    success: true,
    invitation: updated,
    rawToken,
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
