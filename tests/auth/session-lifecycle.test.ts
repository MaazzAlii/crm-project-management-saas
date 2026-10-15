import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { POST as refreshPOST } from '@/app/api/auth/refresh/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';
import { POST as clientSignoutPOST, GET as clientSignoutGET } from '@/app/(client-portal)/client/auth/signout/route';
import { changePassword } from '@/lib/auth/change-password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { query, queryOne } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

describe('AUTH-3: Session Lifecycle, Logout & Refresh Token Rotation', () => {
  let testUserId: string;
  const testEmail = `auth3_lifecycle_${Date.now()}@example.com`;
  const initialPassword = 'Password123!';

  beforeAll(async () => {
    // Set up dedicated test user
    const passwordHash = await hashPassword(initialPassword);
    const res = await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id`,
      [testEmail, passwordHash, 'AUTH-3 Test User', 'user']
    );
    testUserId = res.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [testUserId]);
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  // Helper to create a persisted refresh token in the DB
  async function createPersistedRefreshToken(tokenFamily = crypto.randomUUID(), isRevoked = false) {
    const rawToken = generateRefreshToken({
      userId: testUserId,
      tokenFamily,
      email: testEmail,
      role: 'user',
    });

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, token_family, is_revoked, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
      [testUserId, tokenHash, tokenFamily, isRevoked]
    );

    return { rawToken, tokenHash, tokenFamily };
  }

  // 1. Normal refresh returns 200 with new token pair
  it('1. Normal refresh returns 200 with new token pair', async () => {
    const { rawToken } = await createPersistedRefreshToken();

    const req = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: `innoventix_refresh=${rawToken}` },
    });

    const res = await refreshPOST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.accessToken).toBeDefined();

    const refreshCookie = res.cookies.get('innoventix_refresh');
    expect(refreshCookie?.value).toBeDefined();
    expect(refreshCookie?.value).not.toBe(rawToken);

    const sessionCookie = res.cookies.get('innoventix_session');
    expect(sessionCookie?.value).toBe(body.accessToken);
  });

  // 2. Old refresh token is marked revoked after rotation
  it('2. Old refresh token is marked revoked after rotation', async () => {
    const { rawToken, tokenHash } = await createPersistedRefreshToken();

    const req = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: `innoventix_refresh=${rawToken}` },
    });

    const res = await refreshPOST(req);
    expect(res.status).toBe(200);

    // Verify in database that the old token is now is_revoked = true
    const dbRow = await queryOne<{ is_revoked: boolean }>(
      'SELECT is_revoked FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash]
    );
    expect(dbRow?.is_revoked).toBe(true);
  });

  // 3. Refresh with already-revoked token returns 401 REFRESH_TOKEN_REUSED
  it('3. Refresh with already-revoked token returns 401 REFRESH_TOKEN_REUSED', async () => {
    const { rawToken } = await createPersistedRefreshToken(crypto.randomUUID(), true);

    const req = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: `innoventix_refresh=${rawToken}` },
    });

    const res = await refreshPOST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.code).toBe('REFRESH_TOKEN_REUSED');
  });

  // 4. Reuse revokes all tokens in the family (descendant tokens also fail)
  it('4. Reuse revokes all tokens in the family (descendant tokens also fail)', async () => {
    const familyId = crypto.randomUUID();
    const tokenA = await createPersistedRefreshToken(familyId);

    // Rotate Token A -> issues Token B
    const req1 = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: `innoventix_refresh=${tokenA.rawToken}` },
    });
    const res1 = await refreshPOST(req1);
    expect(res1.status).toBe(200);
    const tokenB = res1.cookies.get('innoventix_refresh')?.value;
    expect(tokenB).toBeDefined();

    // Attacker or replay attempts to reuse rotated Token A
    const reqReuse = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: `innoventix_refresh=${tokenA.rawToken}` },
    });
    const resReuse = await refreshPOST(reqReuse);
    expect(resReuse.status).toBe(401);
    const reuseBody = await resReuse.json();
    expect(reuseBody.code).toBe('REFRESH_TOKEN_REUSED');

    // Descendant Token B must now also be revoked due to family invalidation
    const req2 = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: `innoventix_refresh=${tokenB}` },
    });
    const res2 = await refreshPOST(req2);
    expect(res2.status).toBe(401);
  });

  // 5. Concurrent refresh with same token: exactly 1 succeeds, 1 gets 401 REUSED
  it('5. Concurrent refresh with same token: exactly 1 succeeds, 1 gets 401 REUSED', async () => {
    const { rawToken, tokenFamily } = await createPersistedRefreshToken();

    const makeReq = () =>
      new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { cookie: `innoventix_refresh=${rawToken}` },
      });

    // Fire two concurrent refresh requests with the EXACT same token
    const [res1, res2] = await Promise.all([
      refreshPOST(makeReq()),
      refreshPOST(makeReq()),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one 200, exactly one 401
    expect(statuses).toEqual([200, 401]);

    const failedRes = res1.status === 401 ? res1 : res2;
    const failedBody = await failedRes.json();
    expect(failedBody.code).toBe('REFRESH_TOKEN_REUSED');

    const successRes = res1.status === 200 ? res1 : res2;
    const newToken = successRes.cookies.get('innoventix_refresh')?.value;
    expect(newToken).toBeDefined();

    // Verify all tokens in the family are revoked because the race failure triggered family revocation
    const activeTokens = await query(
      'SELECT id FROM refresh_tokens WHERE token_family = $1 AND is_revoked = false',
      [tokenFamily]
    );
    expect(activeTokens.rows.length).toBe(0);

    // Subsequent refresh with the newly-issued token from the winning request returns 401
    const subsequentReq = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: `innoventix_refresh=${newToken}` },
    });
    const subsequentRes = await refreshPOST(subsequentReq);
    expect(subsequentRes.status).toBe(401);
  });

  // 6. Refresh with nonexistent token returns 401
  it('6. Refresh with nonexistent token returns 401', async () => {
    // Token with valid JWT signature but never persisted in DB
    const phantomToken = generateRefreshToken({
      userId: testUserId,
      tokenFamily: crypto.randomUUID(),
      email: testEmail,
      role: 'user',
    });

    const req = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: `innoventix_refresh=${phantomToken}` },
    });

    const res = await refreshPOST(req);
    expect(res.status).toBe(401);
  });

  // 7. Refresh with expired token returns 401
  it('7. Refresh with expired token returns 401', async () => {
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-min-32-chars-long!';
    // Create explicitly expired token (exp in the past)
    const expiredToken = jwt.sign(
      {
        userId: testUserId,
        tokenFamily: crypto.randomUUID(),
        email: testEmail,
        type: 'refresh',
      },
      jwtSecret,
      { expiresIn: '-10s' }
    );

    const req = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: `innoventix_refresh=${expiredToken}` },
    });

    const res = await refreshPOST(req);
    expect(res.status).toBe(401);
  });

  // 8. Logout revokes token server-side in DB
  it('8. Logout revokes token server-side in DB', async () => {
    const { rawToken, tokenHash } = await createPersistedRefreshToken();

    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: { cookie: `innoventix_refresh=${rawToken}` },
    });

    const res = await logoutPOST(req);
    expect(res.status).toBe(200);

    const dbRow = await queryOne<{ is_revoked: boolean }>(
      'SELECT is_revoked FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash]
    );
    expect(dbRow?.is_revoked).toBe(true);
  });

  // 9. Logout clears both innoventix_session and innoventix_refresh cookies
  it('9. Logout clears both innoventix_session and innoventix_refresh cookies', async () => {
    const { rawToken } = await createPersistedRefreshToken();

    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        cookie: `innoventix_refresh=${rawToken}; innoventix_session=some_session; organization_id=org123`,
      },
    });

    const res = await logoutPOST(req);
    expect(res.status).toBe(200);

    // Both cookies must be explicitly cleared with maxAge: 0
    const sessionCookie = res.cookies.get('innoventix_session');
    const refreshCookie = res.cookies.get('innoventix_refresh');
    const orgCookie = res.cookies.get('organization_id');

    expect(sessionCookie?.maxAge).toBe(0);
    expect(refreshCookie?.maxAge).toBe(0);
    expect(orgCookie?.maxAge).toBe(0);
  });

  // 10. Client portal logout revokes token and clears all cookies
  it('10. Client portal logout revokes token and clears all cookies', async () => {
    const { rawToken, tokenHash } = await createPersistedRefreshToken();

    const req = new NextRequest('http://localhost:3000/client/auth/signout', {
      method: 'POST',
      headers: { cookie: `innoventix_refresh=${rawToken}` },
    });

    const res = await clientSignoutPOST(req);
    // Redirects to /client/login
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get('location')).toContain('/client/login');

    // Token revoked in DB
    const dbRow = await queryOne<{ is_revoked: boolean }>(
      'SELECT is_revoked FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash]
    );
    expect(dbRow?.is_revoked).toBe(true);

    // Cookies cleared
    expect(res.cookies.get('innoventix_session')?.maxAge).toBe(0);
    expect(res.cookies.get('innoventix_refresh')?.maxAge).toBe(0);
    expect(res.cookies.get('organization_id')?.maxAge).toBe(0);
  });

  // 11. Password change revokes all refresh tokens for the user
  it('11. Password change revokes all refresh tokens for the user', async () => {
    // Create multiple active tokens for the user across different families
    await createPersistedRefreshToken();
    await createPersistedRefreshToken();
    await createPersistedRefreshToken();

    const activeBefore = await query<{ count: string }>(
      'SELECT count(*) FROM refresh_tokens WHERE user_id = $1 AND is_revoked = false',
      [testUserId]
    );
    expect(parseInt(activeBefore.rows[0].count, 10)).toBeGreaterThanOrEqual(3);

    // Perform password change
    const newPassword = 'NewSecretPassword456!';
    const changeResult = await changePassword(testUserId, initialPassword, newPassword);
    expect(changeResult.success).toBe(true);

    // Every active refresh token for this user must now be revoked
    const activeAfter = await query<{ count: string }>(
      'SELECT count(*) FROM refresh_tokens WHERE user_id = $1 AND is_revoked = false',
      [testUserId]
    );
    expect(parseInt(activeAfter.rows[0].count, 10)).toBe(0);
  });

  // 12. Access token expires in 30 minutes (exp - iat = 1800)
  it('12. Access token expires in 30 minutes (exp - iat = 1800)', () => {
    const accessToken = generateAccessToken({
      userId: testUserId,
      email: testEmail,
      role: 'user',
    });

    const decoded = jwt.decode(accessToken) as { exp?: number; iat?: number };
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();

    const ttlSeconds = (decoded.exp ?? 0) - (decoded.iat ?? 0);
    expect(ttlSeconds).toBe(1800); // Exactly 30 minutes
  });
});
