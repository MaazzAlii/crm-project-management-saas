import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { POST as signupPost } from '@/app/api/auth/signup/route';
import { GET as confirmGet } from '@/app/api/auth/verify-email/confirm/route';
import { resetRateLimitStore } from '@/lib/security/rate-limit';
import { query } from '@/lib/db';
import { userRepo } from '@/lib/db/repositories/user-repo';
import { emailVerificationRepo } from '@/lib/db/repositories/email-verification-repo';
import { generateToken, hashToken } from '@/lib/security/invite-token';

describe('AUTH-2: Signup Validation, Rate Limiting & Email Verification', () => {
  const createdTestEmails: string[] = [];

  beforeEach(() => {
    resetRateLimitStore();
  });

  afterAll(async () => {
    if (createdTestEmails.length > 0) {
      await query(
        `DELETE FROM users WHERE email = ANY($1::text[])`,
        [createdTestEmails]
      );
    }
  });

  describe('1. Signup Validation & Error Responses (#3)', () => {
    it('1. Signup with valid email + strong password → 200/201', async () => {
      const email = `auth2_valid_${Date.now()}@example.com`;
      createdTestEmails.push(email);

      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Valid User',
          email,
          password: 'StrongP@ssw0rd!2026',
        }),
      });

      const res = await signupPost(req);
      expect([200, 201]).toContain(res.status);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(email);
    });

    it('2. Signup with invalid email format → 400 with VALIDATION_ERROR + field: "email"', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Invalid Email User',
          email: 'not-an-email',
          password: 'StrongP@ssw0rd!2026',
        }),
      });

      const res = await signupPost(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.field).toBe('email');
      expect(data.error.message).toMatch(/valid email/i);
    });

    it('3. Signup with weak password → 400 with VALIDATION_ERROR + field: "password"', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Weak Password User',
          email: `auth2_weak_${Date.now()}@example.com`,
          password: 'a',
        }),
      });

      const res = await signupPost(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.field).toBe('password');
      expect(data.error.message).toMatch(/password/i);
    });

    it('4. Signup with duplicate email → 400 with EMAIL_ALREADY_EXISTS', async () => {
      const duplicateEmail = `auth2_dup_${Date.now()}@example.com`;
      createdTestEmails.push(duplicateEmail);

      // Create user first
      const firstReq = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'First Account',
          email: duplicateEmail,
          password: 'StrongP@ssw0rd!2026',
        }),
      });
      const firstRes = await signupPost(firstReq);
      expect(firstRes.status).toBe(201);

      // Attempt duplicate signup with the same email
      const dupReq = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Duplicate Account',
          email: duplicateEmail,
          password: 'StrongP@ssw0rd!2026',
        }),
      });
      const dupRes = await signupPost(dupReq);
      expect(dupRes.status).toBe(400);

      const data = await dupRes.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('EMAIL_ALREADY_EXISTS');
      expect(data.error.field).toBe('email');
    });

    it('5. Signup with missing required field → 400 with VALIDATION_ERROR + correct field', async () => {
      // Missing email
      const reqNoEmail = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'StrongP@ssw0rd!2026',
        }),
      });
      const resNoEmail = await signupPost(reqNoEmail);
      expect(resNoEmail.status).toBe(400);
      const dataNoEmail = await resNoEmail.json();
      expect(dataNoEmail.error.code).toBe('VALIDATION_ERROR');
      expect(dataNoEmail.error.field).toBe('email');

      // Missing password
      const reqNoPassword = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'valid@example.com',
        }),
      });
      const resNoPassword = await signupPost(reqNoPassword);
      expect(resNoPassword.status).toBe(400);
      const dataNoPassword = await resNoPassword.json();
      expect(dataNoPassword.error.code).toBe('VALIDATION_ERROR');
      expect(dataNoPassword.error.field).toBe('password');
    });
  });

  describe('2. Rate Limiting Scoped to API Only (#4)', () => {
    it('6. Middleware: 20 sequential GET /sign-in requests → all 200 (no 429)', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 20; i++) {
        const req = new NextRequest('http://localhost:3000/sign-in', {
          method: 'GET',
          headers: { 'x-forwarded-for': '198.51.100.20' },
        });
        const res = await middleware(req);
        // Middleware rewrites /sign-in to /login with 200 (or rewrite headers)
        statuses.push(res.status);
      }

      expect(statuses.every((s) => s === 200)).toBe(true);
      expect(statuses.includes(429)).toBe(false);
    });

    it('7. Middleware: 20 sequential GET /signup requests → all 200 (no 429)', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 20; i++) {
        const req = new NextRequest('http://localhost:3000/signup', {
          method: 'GET',
          headers: { 'x-forwarded-for': '198.51.100.21' },
        });
        const res = await middleware(req);
        statuses.push(res.status);
      }

      expect(statuses.every((s) => s === 200)).toBe(true);
      expect(statuses.includes(429)).toBe(false);
    });

    it('8. Middleware: 25 sequential POST /api/auth/login requests → 429 after threshold', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 25; i++) {
        const req = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'x-forwarded-for': '198.51.100.22',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
        });
        const res = await middleware(req);
        statuses.push(res.status);
      }

      // Initial requests within 20 threshold pass middleware (return 200 for next handler)
      expect(statuses[0]).toBe(200);
      // After threshold (20 per min for AUTH tier), 429 must be returned
      expect(statuses.slice(20)).toContain(429);
    });

    it('9. Middleware: 25 sequential POST /api/auth/forgot-password requests → 429 after threshold', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 25; i++) {
        const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'x-forwarded-for': '198.51.100.23',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'reset@example.com' }),
        });
        const res = await middleware(req);
        statuses.push(res.status);
      }

      expect(statuses[0]).toBe(200);
      expect(statuses.slice(20)).toContain(429);
    });
  });

  describe('3. Email Verification Flow (#12)', () => {
    it('10. Signup creates verification token and GET confirm endpoint marks user verified', async () => {
      const email = `auth2_verify_${Date.now()}@example.com`;
      createdTestEmails.push(email);

      // 1. Signup creates user & records verification token
      const signupReq = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Verification Test User',
          email,
          password: 'StrongP@ssw0rd!2026',
        }),
      });

      const signupRes = await signupPost(signupReq);
      expect(signupRes.status).toBe(201);
      const signupData = await signupRes.json();
      const userId = signupData.user.id;

      // 2. Fetch created user - verify email_verified is initially false
      const userBefore = await userRepo.findById(userId);
      expect(userBefore).not.toBeNull();
      expect(userBefore?.email_verified).toBe(false);

      // 3. Verify token creation in email_verifications table
      const latestVerification = await emailVerificationRepo.getLatest(userId);
      expect(latestVerification).not.toBeNull();
      expect(latestVerification?.email).toBe(email);

      // Create a known raw token for deterministic GET confirm test
      const rawToken = generateToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await emailVerificationRepo.insertVerification(userId, email, tokenHash, expiresAt);

      // 4. Hit GET /api/auth/verify-email/confirm?token=...
      const confirmReq = new NextRequest(`http://localhost:3000/api/auth/verify-email/confirm?token=${rawToken}`);
      const confirmRes = await confirmGet(confirmReq);

      // Must redirect to /login?verified=true with 302
      expect(confirmRes.status).toBe(302);
      expect(confirmRes.headers.get('location')).toContain('/login?verified=true');

      // 5. User must now have email_verified = true
      const userAfter = await userRepo.findById(userId);
      expect(userAfter?.email_verified).toBe(true);
      expect(userAfter?.email_verified_at).not.toBeNull();
    });
  });
});
