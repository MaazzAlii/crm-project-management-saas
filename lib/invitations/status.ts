import type { InvitationStatus } from '../types/database';

export const DEFAULT_INVITATION_EXPIRY_DAYS = 7;

/**
 * Calculates default invitation expiry date 7 days from now (or specified base date)
 */
export function getInvitationExpiry(baseDate: Date | string | number = new Date()): Date {
  const base = new Date(baseDate);
  return new Date(base.getTime() + DEFAULT_INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export interface StatusEvaluationInvite {
  accepted_at?: Date | string | null;
  revoked_at?: Date | string | null;
  expires_at: Date | string | number;
}

/**
 * Computes the real-time status of an invitation purely based on timestamps.
 * Rule:
 * 1. If accepted_at is set -> 'accepted'
 * 2. If revoked_at is set -> 'revoked'
 * 3. If expires_at <= now -> 'expired'
 * 4. Otherwise -> 'pending'
 */
export function computeStatus(
  invite: StatusEvaluationInvite,
  now: Date | string | number = new Date()
): InvitationStatus {
  if (invite.accepted_at) {
    return 'accepted';
  }

  if (invite.revoked_at) {
    return 'revoked';
  }

  const nowDate = new Date(now).getTime();
  const expiryDate = new Date(invite.expires_at).getTime();

  if (expiryDate <= nowDate) {
    return 'expired';
  }

  return 'pending';
}

/**
 * An invitation can only be accepted if it is currently 'pending'.
 */
export function canAccept(
  invite: StatusEvaluationInvite,
  now: Date | string | number = new Date()
): boolean {
  return computeStatus(invite, now) === 'pending';
}

/**
 * An invitation can only be revoked if it is currently 'pending'.
 */
export function canRevoke(
  invite: StatusEvaluationInvite,
  now: Date | string | number = new Date()
): boolean {
  return computeStatus(invite, now) === 'pending';
}

/**
 * An invitation can be resent if it is currently 'pending' or 'expired'.
 * Resending an expired invitation will issue a fresh token and renewal period.
 */
export function canResend(
  invite: StatusEvaluationInvite,
  now: Date | string | number = new Date()
): boolean {
  const currentStatus = computeStatus(invite, now);
  return currentStatus === 'pending' || currentStatus === 'expired';
}
