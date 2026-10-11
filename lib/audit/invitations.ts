import { logAuditEvent } from './log';

export const INVITATION_AUDIT_EVENTS = {
  INVITE_CREATED: 'invite.created',
  INVITE_RESENT: 'invite.resent',
  INVITE_REVOKED: 'invite.revoked',
  INVITE_ACCEPTED: 'invite.accepted',
  INVITE_EXPIRED: 'invite.expired',
  INVITE_DECLINED: 'invite.declined',
  MEMBER_ROLE_CHANGED: 'member.role_changed',
  MEMBER_REMOVED: 'member.removed',
  EMAIL_VERIFICATION_SENT: 'email.verification_sent',
  EMAIL_VERIFIED: 'email.verified',
  DOMAIN_CLAIMED: 'domain.claimed',
  DOMAIN_VERIFIED: 'domain.verified',
} as const;

export type InvitationAuditEventType =
  | 'invite.created'
  | 'invite.resent'
  | 'invite.revoked'
  | 'invite.accepted'
  | 'invite.expired'
  | 'invite.declined'
  | 'member.role_changed'
  | 'member.removed'
  | 'email.verification_sent'
  | 'email.verified'
  | 'domain.claimed'
  | 'domain.verified';

export interface LogInvitationAuditParams {
  action: InvitationAuditEventType;
  organizationId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  targetEmail?: string | null;
  role?: string | null;
  domain?: string | null;
  details?: Record<string, any>;
}

/**
 * Record invitation or email verification audit events.
 * Strictly strips any token or hash fields to ensure no sensitive authentication data is logged.
 */
export async function logInvitationAudit(params: LogInvitationAuditParams): Promise<boolean> {
  const sanitizedDetails: Record<string, any> = {};

  // Copy safe fields
  if (params.details) {
    for (const [key, val] of Object.entries(params.details)) {
      const lower = key.toLowerCase();
      if (!lower.includes('token') && !lower.includes('hash') && !lower.includes('secret')) {
        sanitizedDetails[key] = val;
      }
    }
  }

  if (params.targetEmail) {
    sanitizedDetails.targetEmail = params.targetEmail.toLowerCase().trim();
  }
  if (params.role) {
    sanitizedDetails.role = params.role;
  }
  if (params.domain) {
    sanitizedDetails.domain = params.domain.toLowerCase().trim();
  }

  return await logAuditEvent({
    action: params.action,
    organizationId: params.organizationId,
    actorId: params.actorId || null,
    actorEmail: params.actorEmail || null,
    entityType: params.action.split('.')[0],
    details: sanitizedDetails,
  });
}
