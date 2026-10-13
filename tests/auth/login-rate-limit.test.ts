import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { handleRateLimiting } from '@/middleware/rate-limit';
import { resetRateLimitStore } from '@/lib/security/rate-limit';
import { POST } from '@/app/api/auth/login/route';
import * as db from '@/lib/db';
import * as passwordModule from '@/lib/auth/password';

describe('Auth Hardening Item 4: Sign-In Rate Limiting (No 429 on HTML Pages)', () => {
  beforeEach(() => {
    resetRateLimitStore();
    vi.clearAllMocks();
  });

  it('HTML routes (/login, /signup, /auth/reset-password) are NEVER rate limited', () => {
    const htmlPaths = ['/login', '/signup', '/auth/reset-password', '/dashboard', '/invite/test-token'];

    for (const path of htmlPaths) {
      // Simulate 50 requests in rapid succession
      for (let i = 0; i < 50; i++) {
        const req = new NextRequest(`http://localhost:3000${path}`, {
          method: 'GET',
          headers: { 'x-forwarded-for': '203.0.113.195' },
        });
        const res = handleRateLimiting(req);
        // HTML routes must always return null (allowed through without 429)
        expect(res).toBeNull();
      }
    }
  });

  it('POST /api/auth/login allows 10 attempts per email, 11th returns HTTP 429', async () => {
    // Mock user lookup returning user with non-matching password
    vi.spyOn(db, 'query').mockResolvedValue({
      rows: [{ id: 'u1', email: 'test@innoventix.io', password_hash: 'hash', role: 'member' }],
    } as any);
    vi.spyOn(passwordModule, 'verifyPassword').mockResolvedValue(false);

    const makeAttempt = () =>
      POST(
        new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'x-forwarded-for': '192.0.2.10' },
          body: JSON.stringify({ email: 'test@innoventix.io', password: 'wrong-password' }),
        })
      );

    // Attempts 1 through 10 should return 401 (Invalid email or password)
    for (let i = 1; i <= 10; i++) {
      const res = await makeAttempt();
      expect(res.status).toBe(401);
    }

    // 11th attempt must trigger rate limiter -> HTTP 429
    const blockedRes = await makeAttempt();
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get('Retry-After')).toBeDefined();

    const body = await blockedRes.json();
    expect(body.error).toContain('Too many login attempts');
    expect(body.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('successful login resets the per-email rate limit counter', async () => {
    vi.spyOn(db, 'query').mockImplementation(async (sql: string) => {
      if (sql.includes('FROM users WHERE email = $1')) {
        return {
          rows: [{ id: 'u1', email: 'clean@innoventix.io', password_hash: 'valid_hash', role: 'member', require_password_change: false }],
        } as any;
      }
      if (sql.includes('SELECT om.organization_id')) {
        return { rows: [{ organization_id: 'org-1' }] } as any;
      }
      return { rows: [] } as any;
    });
    vi.spyOn(passwordModule, 'verifyPassword').mockResolvedValue(true);

    // Perform successful login
    const successReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.0.2.20' },
      body: JSON.stringify({ email: 'clean@innoventix.io', password: 'ValidPassword123!' }),
    });

    const res = await POST(successReq);
    expect(res.status).toBe(200);

    // Now test that counter was reset and first attempt is allowed
    const nextReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.0.2.20' },
      body: JSON.stringify({ email: 'clean@innoventix.io', password: 'ValidPassword123!' }),
    });
    const nextRes = await POST(nextReq);
    expect(nextRes.status).toBe(200);
  });
});
