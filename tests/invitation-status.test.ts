import { describe, it, expect } from 'vitest';
import {
  computeStatus,
  canAccept,
  canRevoke,
  canResend,
  DEFAULT_INVITATION_EXPIRY_DAYS,
  getInvitationExpiry,
} from '../lib/invitations/status';

describe('Prompt 07: Invitation Status Rules', () => {
  const baseNow = new Date('2026-10-12T12:00:00Z');
  const futureExpiry = new Date('2026-10-19T12:00:00Z');
  const pastExpiry = new Date('2026-10-10T12:00:00Z');

  it('exports DEFAULT_INVITATION_EXPIRY_DAYS as 7 and computes correct future expiry date', () => {
    expect(DEFAULT_INVITATION_EXPIRY_DAYS).toBe(7);
    const calculatedExpiry = getInvitationExpiry(baseNow);
    expect(calculatedExpiry.getTime() - baseNow.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('returns accepted if accepted_at is set', () => {
    const invite = {
      accepted_at: new Date('2026-10-13T10:00:00Z'),
      revoked_at: null,
      expires_at: futureExpiry,
    };
    expect(computeStatus(invite, baseNow)).toBe('accepted');
  });

  it('returns revoked if revoked_at is set', () => {
    const invite = {
      accepted_at: null,
      revoked_at: new Date('2026-10-13T10:00:00Z'),
      expires_at: futureExpiry,
    };
    expect(computeStatus(invite, baseNow)).toBe('revoked');
  });

  it('returns expired if expires_at is before now', () => {
    const invite = {
      accepted_at: null,
      revoked_at: null,
      expires_at: pastExpiry,
    };
    expect(computeStatus(invite, baseNow)).toBe('expired');
  });

  it('handles boundary at exactly expires_at: expired when expires_at <= now or expires_at < now', () => {
    const exactInvite = {
      accepted_at: null,
      revoked_at: null,
      expires_at: baseNow,
    };
    // At boundary: when now === expires_at, it is expired
    expect(computeStatus(exactInvite, baseNow)).toBe('expired');

    const oneMsAfterExpiry = new Date(baseNow.getTime() + 1);
    expect(computeStatus(exactInvite, oneMsAfterExpiry)).toBe('expired');

    const oneMsBeforeExpiry = new Date(baseNow.getTime() - 1);
    expect(computeStatus(exactInvite, oneMsBeforeExpiry)).toBe('pending');
  });

  it('returns pending when not accepted, not revoked, and expires_at is in the future', () => {
    const invite = {
      accepted_at: null,
      revoked_at: null,
      expires_at: futureExpiry,
    };
    expect(computeStatus(invite, baseNow)).toBe('pending');
  });

  it('canAccept only returns true for pending invitations', () => {
    const pendingInvite = { accepted_at: null, revoked_at: null, expires_at: futureExpiry };
    const acceptedInvite = { accepted_at: baseNow, revoked_at: null, expires_at: futureExpiry };
    const revokedInvite = { accepted_at: null, revoked_at: baseNow, expires_at: futureExpiry };
    const expiredInvite = { accepted_at: null, revoked_at: null, expires_at: pastExpiry };

    expect(canAccept(pendingInvite, baseNow)).toBe(true);
    expect(canAccept(acceptedInvite, baseNow)).toBe(false);
    expect(canAccept(revokedInvite, baseNow)).toBe(false);
    expect(canAccept(expiredInvite, baseNow)).toBe(false);
  });

  it('canRevoke only returns true for pending invitations', () => {
    const pendingInvite = { accepted_at: null, revoked_at: null, expires_at: futureExpiry };
    const acceptedInvite = { accepted_at: baseNow, revoked_at: null, expires_at: futureExpiry };
    const revokedInvite = { accepted_at: null, revoked_at: baseNow, expires_at: futureExpiry };
    const expiredInvite = { accepted_at: null, revoked_at: null, expires_at: pastExpiry };

    expect(canRevoke(pendingInvite, baseNow)).toBe(true);
    expect(canRevoke(acceptedInvite, baseNow)).toBe(false);
    expect(canRevoke(revokedInvite, baseNow)).toBe(false);
    expect(canRevoke(expiredInvite, baseNow)).toBe(false);
  });

  it('canResend returns true for pending or expired invitations, but false for accepted or revoked', () => {
    const pendingInvite = { accepted_at: null, revoked_at: null, expires_at: futureExpiry };
    const expiredInvite = { accepted_at: null, revoked_at: null, expires_at: pastExpiry };
    const acceptedInvite = { accepted_at: baseNow, revoked_at: null, expires_at: futureExpiry };
    const revokedInvite = { accepted_at: null, revoked_at: baseNow, expires_at: futureExpiry };

    expect(canResend(pendingInvite, baseNow)).toBe(true);
    expect(canResend(expiredInvite, baseNow)).toBe(true);
    expect(canResend(acceptedInvite, baseNow)).toBe(false);
    expect(canResend(revokedInvite, baseNow)).toBe(false);
  });
});
