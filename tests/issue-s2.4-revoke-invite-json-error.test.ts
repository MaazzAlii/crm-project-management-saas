import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import { extractApiError, FRIENDLY_ERROR_MESSAGES } from '../lib/utils/api-error';
import { revokeInvitation } from '../lib/services/invitation-service';
import { POST as revokeInviteRoute } from '../app/api/invitations/[id]/revoke/route';
import { generateAccessToken } from '../lib/auth/jwt';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { invitationRepo } from '../lib/db/repositories/invitation-repo';
import { query } from '../lib/db';

describe('ISSUE-S2.4: Revoke Invite JSON Error & Computed Status Fixes', () => {
  let orgAId: string;
  let orgBId: string;
  let ownerUserAId: string;
  let memberUserAId: string;
  let expiredInviteId: string;
  let otherOrgInviteId: string;

  beforeAll(async () => {
    // 1. Create test organizations
    const orgA = await orgRepo.create({
      name: `S2.4 Test Org A ${Date.now()}`,
      slug: `s2-4-org-a-${Date.now()}`,
    });
    orgAId = orgA.id;

    const orgB = await orgRepo.create({
      name: `S2.4 Test Org B ${Date.now()}`,
      slug: `s2-4-org-b-${Date.now()}`,
    });
    orgBId = orgB.id;

    // 2. Create users
    const ownerA = await userRepo.create({
      email: `s2_4_owner_${Date.now()}@innoventix.io`,
      fullName: 'S2.4 Owner A',
      passwordHash: 'hash123',
    });
    ownerUserAId = ownerA.id;

    const memberA = await userRepo.create({
      email: `s2_4_member_${Date.now()}@innoventix.io`,
      fullName: 'S2.4 Member A',
      passwordHash: 'hash123',
    });
    memberUserAId = memberA.id;

    // 3. Assign memberships
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role) 
       VALUES ($1, $2, 'owner'), ($1, $3, 'member')`,
      [orgAId, ownerUserAId, memberUserAId]
    );

    // 4. Create an expired invitation for Org A (status column is 'pending', expires_at is 2 days ago)
    const expiredInvite = await invitationRepo.insertInvitation(orgAId, {
      email: `expired_invite_${Date.now()}@example.com`,
      role: 'member',
      invitedBy: ownerUserAId,
      tokenHash: `hash_exp_${Date.now()}`,
      expiresAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    });
    expiredInviteId = expiredInvite.id;

    // 5. Create an invitation for Org B to test tenant isolation
    const otherInvite = await invitationRepo.insertInvitation(orgBId, {
      email: `other_org_${Date.now()}@example.com`,
      role: 'member',
      invitedBy: ownerUserAId,
      tokenHash: `hash_other_${Date.now()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    otherOrgInviteId = otherInvite.id;
  });

  afterAll(async () => {
    if (orgAId) await query('DELETE FROM organizations WHERE id = $1', [orgAId]);
    if (orgBId) await query('DELETE FROM organizations WHERE id = $1', [orgBId]);
    if (ownerUserAId) await query('DELETE FROM users WHERE id IN ($1, $2)', [ownerUserAId, memberUserAId]);
  });

  describe('1. Error Extractor (extractApiError)', () => {
    it('handles Shape 1: primitive error string and maps known error codes', () => {
      expect(extractApiError({ error: 'NOT_FOUND' })).toBe(FRIENDLY_ERROR_MESSAGES.NOT_FOUND);
      expect(extractApiError({ error: 'INVALID_STATUS' })).toBe(FRIENDLY_ERROR_MESSAGES.INVALID_STATUS);
      expect(extractApiError({ error: 'FORBIDDEN' })).toBe(FRIENDLY_ERROR_MESSAGES.FORBIDDEN);
      expect(extractApiError({ error: 'UNAUTHORIZED' })).toBe(FRIENDLY_ERROR_MESSAGES.UNAUTHORIZED);
      expect(extractApiError({ error: 'Custom technical error' })).toBe('Custom technical error');
    });

    it('handles Shape 2: structured error object { message, code } without returning [object Object]', () => {
      const serverPayload = {
        success: false,
        error: {
          message: 'Only pending invitations can be revoked. Current status is expired.',
          code: 'INVALID_STATUS',
        },
      };

      const extracted = extractApiError(serverPayload);
      expect(extracted).not.toBe('[object Object]');
      expect(extracted).toBe('Only pending invitations can be revoked. Current status is expired.');

      // If message is absent but code is present, map friendly message
      const codeOnlyPayload = {
        success: false,
        error: {
          code: 'INVALID_STATUS',
        },
      };
      expect(extractApiError(codeOnlyPayload)).toBe(FRIENDLY_ERROR_MESSAGES.INVALID_STATUS);
    });

    it('handles Shape 3: top-level message string', () => {
      expect(extractApiError({ message: 'Invitation revoked successfully' })).toBe('Invitation revoked successfully');
      expect(extractApiError({ message: 'NOT_FOUND' })).toBe(FRIENDLY_ERROR_MESSAGES.NOT_FOUND);
    });

    it('handles fallback cases for empty or non-object input gracefully', () => {
      const customFallback = 'Failed to revoke';
      expect(extractApiError({}, customFallback)).toBe(customFallback);
      expect(extractApiError(null, customFallback)).toBe(customFallback);
      expect(extractApiError(undefined, customFallback)).toBe(customFallback);
      expect(extractApiError(12345, customFallback)).toBe(customFallback);
    });
  });

  describe('2. Regression: 409 Message for Expired Invitation uses computed status', () => {
    it('returns "expired" instead of "pending" for expired invitations in 409 error message', async () => {
      const session = { userId: ownerUserAId, orgId: orgAId };
      const result = await revokeInvitation(session, expiredInviteId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('invalid_status');
        expect(result.status).toBe(400);

        // Must say "expired" and NOT "pending"
        expect(result.message).toContain('Current status is expired.');
        expect(result.message).not.toContain('Current status is pending.');
      }
    });

    it('enforces tenant isolation: cannot revoke invitation belonging to another organization (404)', async () => {
      const sessionOrgA = { userId: ownerUserAId, orgId: orgAId };
      const result = await revokeInvitation(sessionOrgA, otherOrgInviteId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('not_found');
        expect(result.status).toBe(404);
      }
    });

    it('enforces RBAC role checks: members cannot revoke invitations (403)', async () => {
      const sessionMember = { userId: memberUserAId, orgId: orgAId };
      const result = await revokeInvitation(sessionMember, expiredInviteId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('forbidden');
        expect(result.status).toBe(403);
      }
    });
  });

  describe('3. Route Handler & Error Coercion Regression', () => {
    it('real POST /api/invitations/[id]/revoke returns 409 with computed status message', async () => {
      const token = generateAccessToken({
        userId: ownerUserAId,
        orgId: orgAId,
        email: 'owner_test@innoventix.io',
        role: 'org_admin',
      });

      const req = new NextRequest(`http://localhost:3000/api/invitations/${expiredInviteId}/revoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await revokeInviteRoute(req, {
        params: Promise.resolve({ id: expiredInviteId }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_STATUS');
      expect(data.error.message).toBe('Only pending invitations can be revoked. Current status is expired.');

      // Real extractApiError resolves to human-friendly text, never [object Object]
      const friendlyToast = extractApiError(data);
      expect(friendlyToast).not.toBe('[object Object]');
      expect(friendlyToast).toBe('Only pending invitations can be revoked. Current status is expired.');
    });

    it('confirms the bug mechanism: legacy throw new Error(data.error) stringifies error object to [object Object]', async () => {
      const token = generateAccessToken({
        userId: ownerUserAId,
        orgId: orgAId,
        email: 'owner_test@innoventix.io',
        role: 'org_admin',
      });

      const req = new NextRequest(`http://localhost:3000/api/invitations/${expiredInviteId}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await revokeInviteRoute(req, {
        params: Promise.resolve({ id: expiredInviteId }),
      });
      const data = await response.json();

      // Legacy bug pattern (PendingInvitationsList.tsx pre-fix line 208):
      // throw new Error(data.error || data.message || ...)
      const legacyError = new Error(data.error);
      expect(legacyError.message).toBe('[object Object]');

      // Fixed pattern: extractApiError prevents [object Object]
      const fixedError = new Error(extractApiError(data));
      expect(fixedError.message).not.toBe('[object Object]');
      expect(fixedError.message).toBe('Only pending invitations can be revoked. Current status is expired.');
    });
  });

  describe('4. Component Source Audit: Modal Portaling & Backdrop Blur Removal', () => {
    it('verifies PendingInvitationsList renders dialog into document.body and has backdrop-blur removed', () => {
      const source = fs.readFileSync('components/settings/PendingInvitationsList.tsx', 'utf-8');
      expect(source).toContain('createPortal(');
      expect(source).toContain('document.body');
      // Must not contain backdrop-blur on revoke modal
      expect(source).not.toContain('backdrop-blur-sm animate-in fade-in');
    });
  });
});
