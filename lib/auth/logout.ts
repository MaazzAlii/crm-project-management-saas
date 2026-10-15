import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  getDefaultSessionConfig,
  getRefreshSessionConfig,
  getRefreshTokenFromCookie,
  deleteRefreshTokenCookie,
} from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';
import { verifyRefreshToken } from '@/lib/auth/jwt';

/**
 * Clear all authentication and tenant cookies from an outgoing NextResponse.
 * Ensures consistent cookie deletion across API logout, client portal signout,
 * and refresh token revocation responses.
 */
export function clearAuthCookies(
  response: NextResponse,
  requestHeaders?: Headers | { get(name: string): string | null } | null
): void {
  const sessionConfig = getDefaultSessionConfig(requestHeaders);
  const refreshConfig = getRefreshSessionConfig(requestHeaders);

  // 1. Session access token cookie
  response.cookies.set(sessionConfig.cookieName, '', {
    httpOnly: sessionConfig.cookieHttpOnly,
    secure: sessionConfig.cookieSecure,
    sameSite: sessionConfig.cookieSameSite,
    maxAge: 0,
    domain: sessionConfig.cookieDomain,
    path: '/',
  });

  // 2. Refresh token cookie
  response.cookies.set(refreshConfig.cookieName, '', {
    httpOnly: refreshConfig.cookieHttpOnly,
    secure: refreshConfig.cookieSecure,
    sameSite: refreshConfig.cookieSameSite,
    maxAge: 0,
    domain: refreshConfig.cookieDomain,
    path: '/',
  });

  // 3. Organization context cookie
  response.cookies.set('organization_id', '', {
    httpOnly: false,
    secure: sessionConfig.cookieSecure,
    sameSite: sessionConfig.cookieSameSite,
    maxAge: 0,
    domain: sessionConfig.cookieDomain,
    path: '/',
  });
}

/**
 * Centralized session revocation and cookie clearing helper.
 * Revokes the caller's refresh token family server-side in PostgreSQL
 * and clears innoventix_session, innoventix_refresh, and organization_id cookies.
 *
 * Used by both /api/auth/logout (JSON response) and /client/auth/signout (Redirect response).
 */
export async function revokeSessionAndClearCookies(
  request: NextRequest,
  redirectUrl?: string
): Promise<NextResponse> {
  const refreshConfig = getRefreshSessionConfig(request.headers);
  const refreshToken =
    request.cookies.get(refreshConfig.cookieName)?.value ||
    (await getRefreshTokenFromCookie(refreshConfig.cookieName));

  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Look up token family to revoke the active session family
    const tokenRow = await queryOne<{ token_family: string }>(
      'SELECT token_family FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash]
    );

    const family = tokenRow?.token_family || verifyRefreshToken(refreshToken)?.tokenFamily;
    if (family) {
      await query('UPDATE refresh_tokens SET is_revoked = true WHERE token_family = $1', [family]);
    } else {
      await query('UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1', [tokenHash]);
    }
  }

  // Also clear cookie store if inside server action context
  await deleteRefreshTokenCookie();

  // Create response (either redirect or JSON)
  const response = redirectUrl
    ? NextResponse.redirect(new URL(redirectUrl, request.url))
    : NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

  // Attach explicit Set-Cookie deletion headers
  clearAuthCookies(response, request.headers);

  return response;
}
