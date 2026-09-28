import { cookies } from 'next/headers';

export interface SessionConfig {
  cookieName: string;
  cookieDomain?: string;
  cookieSecure: boolean;
  cookieHttpOnly: boolean;
  cookieSameSite: 'lax' | 'strict' | 'none';
  maxAge: number; // in seconds
}

const defaultConfig: SessionConfig = {
  cookieName: process.env.COOKIE_NAME || 'innoventix_session',
  cookieDomain: process.env.COOKIE_DOMAIN,
  cookieSecure: process.env.NODE_ENV === 'production',
  cookieHttpOnly: true,
  cookieSameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

/**
 * Set a refresh token in HTTP-only cookie
 */
export async function setRefreshTokenCookie(
  token: string,
  config: Partial<SessionConfig> = {}
): Promise<void> {
  const finalConfig = { ...defaultConfig, ...config };
  try {
    const cookieStore = await cookies();
    cookieStore.set(finalConfig.cookieName, token, {
      httpOnly: finalConfig.cookieHttpOnly,
      secure: finalConfig.cookieSecure,
      sameSite: finalConfig.cookieSameSite,
      maxAge: finalConfig.maxAge,
      domain: finalConfig.cookieDomain,
      path: '/',
    });
  } catch (err) {
    // Gracefully handle contexts where cookies() is not available (CLI, unit tests)
  }
}

/**
 * Get refresh token from cookie
 */
export async function getRefreshTokenFromCookie(
  cookieName: string = process.env.COOKIE_NAME || 'innoventix_session'
): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(cookieName)?.value;
  } catch (err) {
    return undefined;
  }
}

/**
 * Delete refresh token cookie
 */
export async function deleteRefreshTokenCookie(
  cookieName: string = process.env.COOKIE_NAME || 'innoventix_session'
): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(cookieName);
  } catch (err) {
    // Gracefully handle contexts where cookies() is not available
  }
}

/**
 * Verify cookie is still valid
 */
export async function isSessionValid(
  cookieName: string = process.env.COOKIE_NAME || 'innoventix_session'
): Promise<boolean> {
  const token = await getRefreshTokenFromCookie(cookieName);
  return !!token;
}
