import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { query } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { emailVerificationRepo } from '../lib/db/repositories/email-verification-repo';
import { domainVerificationRepo } from '../lib/db/repositories/domain-verification-repo';
import { hashToken, generateToken } from '../lib/security/invite-token';
import * as authMiddleware from '../lib/auth/middleware';
import * as sendEmailRoute from '../app/api/auth/verify-email/send/route';
import * as confirmEmailRoute from '../app/api/auth/verify-email/confirm/route';
import * as sendDomainCodeRoute from '../app/api/organizations/domain/send-code/route';
import * as confirmDomainRoute from '../app/api/organizations/domain/confirm/route';

describe('Prompt 26: API Email Verification & Business Domain Codes', () => {
  let ownerUserId: string;
  let memberUserId: string;
  let otherUserId: string;
  let ownerEmail: string;
  let memberEmail: string;
  let otherEmail: string;
  let testOrgId: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    ownerEmail = `owner_ev_${id}@innoventix.io`;
    memberEmail = `member_ev_${id}@innoventix.io`;
    otherEmail = `other_ev_${id}@external.com`;

    const owner = await userRepo.create({
      email: ownerEmail,
      fullName: 'Owner EV',
      passwordHash: 'dummy_hash',
    });
    ownerUserId = owner.id;

    const member = await userRepo.create({
      email: memberEmail,
      fullName: 'Member EV',
      passwordHash: 'dummy_hash',
    });
    memberUserId = member.id;

    const other = await userRepo.create({
      email: otherEmail,
      fullName: 'Other EV',
      passwordHash: 'dummy_hash',
    });
    otherUserId = other.id;

    const org = await orgRepo.create({
      name: 'EV Test Org ' + id,
      slug: 'ev-org-' + id,
      ownerUserId,
    });
    testOrgId = org.id;

    await orgRepo.addMember(testOrgId, memberUserId, 'member');
  });

  describe('1. POST /api/auth/verify-email/send', () => {
    it('returns 401 if unauthenticated', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue(null);

      const req = new NextRequest('http://localhost:3000/api/auth/verify-email/send', {
        method: 'POST',
      });
      const res = await sendEmailRoute.POST(req);
      expect(res.status).toBe(401);
    });

    it('sends verification email, creates row, and invalidates older unconsumed codes', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
        userId: ownerUserId,
        email: ownerEmail,
        role: 'org_admin',
        orgId: testOrgId,
      });

      // Insert an old pending verification
      const oldToken = generateToken();
      await emailVerificationRepo.insertVerification(
        ownerUserId,
        ownerEmail,
        hashToken(oldToken),
        new Date(Date.now() + 86400000)
      );

      // Backdate the old verification so it doesn't trigger the 60s rate limit
      await query(
        `UPDATE email_verifications SET created_at = NOW() - INTERVAL '2 minutes' WHERE user_id = $1`,
        [ownerUserId]
      );

      const req = new NextRequest('http://localhost:3000/api/auth/verify-email/send', {
        method: 'POST',
      });
      const res = await sendEmailRoute.POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);

      // Verify old token was invalidated (consumed_at set)
      const oldRow = await emailVerificationRepo.findByTokenHash(hashToken(oldToken));
      expect(oldRow?.consumed_at).not.toBeNull();

      // Verify a new unconsumed row exists
      const latest = await emailVerificationRepo.getLatest(ownerUserId);
      expect(latest).toBeDefined();
      expect(latest?.consumed_at).toBeNull();
    });

    it('enforces 60-second rate limit on send requests', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
        userId: memberUserId,
        email: memberEmail,
        role: 'user',
        orgId: testOrgId,
      });

      // First send succeeds
      const req1 = new NextRequest('http://localhost:3000/api/auth/verify-email/send', {
        method: 'POST',
      });
      const res1 = await sendEmailRoute.POST(req1);
      expect(res1.status).toBe(200);

      // Immediate second send fails with 429
      const req2 = new NextRequest('http://localhost:3000/api/auth/verify-email/send', {
        method: 'POST',
      });
      const res2 = await sendEmailRoute.POST(req2);
      expect(res2.status).toBe(429);
      const body2 = await res2.json();
      expect(body2.error?.message).toMatch(/too many requests|60 seconds/i);
    });
  });

  describe('2. POST /api/auth/verify-email/confirm', () => {
    it('rejects missing or invalid token', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/verify-email/confirm', {
        method: 'POST',
        body: JSON.stringify({ token: 'nonexistent-token' }),
      });
      const res = await confirmEmailRoute.POST(req);
      expect(res.status).toBe(400);
    });

    it('rejects expired token', async () => {
      const rawToken = generateToken();
      await emailVerificationRepo.insertVerification(
        ownerUserId,
        ownerEmail,
        hashToken(rawToken),
        new Date(Date.now() - 1000) // already expired
      );

      const req = new NextRequest('http://localhost:3000/api/auth/verify-email/confirm', {
        method: 'POST',
        body: JSON.stringify({ token: rawToken }),
      });
      const res = await confirmEmailRoute.POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error?.message).toMatch(/expired/i);
    });

    it('consumes row atomically and marks user email_verified_at', async () => {
      const rawToken = generateToken();
      await emailVerificationRepo.insertVerification(
        ownerUserId,
        ownerEmail,
        hashToken(rawToken),
        new Date(Date.now() + 86400000)
      );

      const req = new NextRequest('http://localhost:3000/api/auth/verify-email/confirm', {
        method: 'POST',
        body: JSON.stringify({ token: rawToken }),
      });
      const res = await confirmEmailRoute.POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify user has email_verified_at set
      const updatedUser = await userRepo.findById(ownerUserId);
      expect(updatedUser?.email_verified).toBe(true);
      expect((updatedUser as any)?.email_verified_at).toBeDefined();

      // Verify row is consumed
      const row = await emailVerificationRepo.findByTokenHash(hashToken(rawToken));
      expect(row?.consumed_at).not.toBeNull();

      // One-time check: confirming again fails with 400
      const retryReq = new NextRequest('http://localhost:3000/api/auth/verify-email/confirm', {
        method: 'POST',
        body: JSON.stringify({ token: rawToken }),
      });
      const retryRes = await confirmEmailRoute.POST(retryReq);
      expect(retryRes.status).toBe(400);
      const retryData = await retryRes.json();
      expect(retryData.error?.message).toMatch(/used|consumed|already/i);
    });
  });

  describe('3. POST /api/organizations/domain/send-code', () => {
    it('returns 401 if unauthenticated', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue(null);

      const req = new NextRequest('http://localhost:3000/api/organizations/domain/send-code', {
        method: 'POST',
        body: JSON.stringify({ domain: 'innoventix.io', targetEmail: 'admin@innoventix.io' }),
      });
      const res = await sendDomainCodeRoute.POST(req);
      expect(res.status).toBe(401);
    });

    it('disallows non-owner members from claiming a domain (403)', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
        userId: memberUserId,
        email: memberEmail,
        role: 'user',
        orgId: testOrgId,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/domain/send-code', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: testOrgId,
          domain: 'innoventix.io',
          targetEmail: 'admin@innoventix.io',
        }),
      });
      const res = await sendDomainCodeRoute.POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error?.message).toMatch(/owner/i);
    });

    it('rejects domain verification on Free tier organizations (upgrade required)', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
        userId: ownerUserId,
        email: ownerEmail,
        role: 'org_admin',
        orgId: testOrgId,
      });

      // Default org has Free plan
      const req = new NextRequest('http://localhost:3000/api/organizations/domain/send-code', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: testOrgId,
          domain: 'innoventix.io',
          targetEmail: 'admin@innoventix.io',
        }),
      });
      const res = await sendDomainCodeRoute.POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error?.code).toBe('UPGRADE_REQUIRED');
    });

    it('rejects target email that does not match claimed domain', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
        userId: ownerUserId,
        email: ownerEmail,
        role: 'org_admin',
        orgId: testOrgId,
      });

      // Elevate org to Pro
      await query(
        `INSERT INTO organization_plans (organization_id, plan_id, status)
         VALUES ($1, 'pro', 'active')
         ON CONFLICT (organization_id) DO UPDATE SET plan_id = 'pro'`,
        [testOrgId]
      );

      const req = new NextRequest('http://localhost:3000/api/organizations/domain/send-code', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: testOrgId,
          domain: 'innoventix.io',
          targetEmail: 'admin@external.com', // Mismatched domain
        }),
      });
      const res = await sendDomainCodeRoute.POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error?.message).toMatch(/domain/i);
    });

    it('succeeds for owner of Pro org with matching email, creating verification record', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
        userId: ownerUserId,
        email: ownerEmail,
        role: 'org_admin',
        orgId: testOrgId,
      });

      await query(
        `INSERT INTO organization_plans (organization_id, plan_id, status)
         VALUES ($1, 'pro', 'active')
         ON CONFLICT (organization_id) DO UPDATE SET plan_id = 'pro'`,
        [testOrgId]
      );

      const req = new NextRequest('http://localhost:3000/api/organizations/domain/send-code', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: testOrgId,
          domain: 'innoventix.io',
          targetEmail: 'admin@innoventix.io',
        }),
      });
      const res = await sendDomainCodeRoute.POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify record stored in domain_verifications
      const check = await query<{ count: string }>(
        'SELECT count(*) as count FROM domain_verifications WHERE organization_id = $1 AND domain = $2',
        [testOrgId, 'innoventix.io']
      );
      expect(parseInt(check.rows[0].count, 10)).toBeGreaterThan(0);
    });
  });

  describe('4. POST /api/organizations/domain/confirm', () => {
    let validCode: string;
    let validToken: string;

    beforeEach(async () => {
      // Elevate org to Pro
      await query(
        `INSERT INTO organization_plans (organization_id, plan_id, status)
         VALUES ($1, 'pro', 'active')
         ON CONFLICT (organization_id) DO UPDATE SET plan_id = 'pro'`,
        [testOrgId]
      );

      validCode = '742918';
      validToken = generateToken();

      await domainVerificationRepo.insertVerification(
        testOrgId,
        ownerUserId,
        'innoventix.io',
        'admin@innoventix.io',
        hashToken(validToken),
        hashToken(validCode),
        new Date(Date.now() + 3600000)
      );
    });

    it('disallows non-owner members from confirming a domain (403)', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
        userId: memberUserId,
        email: memberEmail,
        role: 'user',
        orgId: testOrgId,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/domain/confirm', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: testOrgId,
          domain: 'innoventix.io',
          code: validCode,
        }),
      });
      const res = await confirmDomainRoute.POST(req);
      expect(res.status).toBe(403);
    });

    it('rejects confirmation if code was issued for another user (403)', async () => {
      // Add otherUser as co-owner in org to isolate the user identity check
      await orgRepo.addMember(testOrgId, otherUserId, 'owner');

      // Other user tries to claim using code issued to owner
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
        userId: otherUserId,
        email: otherEmail,
        role: 'org_admin',
        orgId: testOrgId,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/domain/confirm', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: testOrgId,
          domain: 'innoventix.io',
          code: validCode,
        }),
      });
      const res = await confirmDomainRoute.POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error?.message).toMatch(/another user|issued for a different user/i);
    });

    it('rejects expired code', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
        userId: ownerUserId,
        email: ownerEmail,
        role: 'org_admin',
        orgId: testOrgId,
      });

      const expiredCode = '112233';
      await domainVerificationRepo.insertVerification(
        testOrgId,
        ownerUserId,
        'expired.io',
        'admin@expired.io',
        hashToken(generateToken()),
        hashToken(expiredCode),
        new Date(Date.now() - 5000)
      );

      const req = new NextRequest('http://localhost:3000/api/organizations/domain/confirm', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: testOrgId,
          domain: 'expired.io',
          code: expiredCode,
        }),
      });
      const res = await confirmDomainRoute.POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error?.message).toMatch(/expired/i);
    });

    it('owner confirms valid code: sets verified_domain and domain_verified_at, code is one-time', async () => {
      vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
        userId: ownerUserId,
        email: ownerEmail,
        role: 'org_admin',
        orgId: testOrgId,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/domain/confirm', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: testOrgId,
          domain: 'innoventix.io',
          code: validCode,
        }),
      });
      const res = await confirmDomainRoute.POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.verifiedDomain).toBe('innoventix.io');

      // Verify in DB
      const domainInfo = await orgRepo.getVerifiedDomain(testOrgId);
      expect(domainInfo?.verifiedDomain).toBe('innoventix.io');
      expect(domainInfo?.domainVerifiedAt).toBeDefined();

      // One-time verification: second call fails with 400
      const retryReq = new NextRequest('http://localhost:3000/api/organizations/domain/confirm', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: testOrgId,
          domain: 'innoventix.io',
          code: validCode,
        }),
      });
      const retryRes = await confirmDomainRoute.POST(retryReq);
      expect(retryRes.status).toBe(400);
      const retryData = await retryRes.json();
      expect(retryData.error?.message).toMatch(/used|consumed|already/i);
    });
  });
});
