import { jwtVerify } from 'jose'

export interface EdgeTokenPayload {
  userId: string
  email?: string
  role?: 'user' | 'org_admin' | 'super_admin' | string
  orgId?: string
  tokenFamily?: string
  [key: string]: any
}

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret && secret.length >= 32) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is missing or shorter than 32 characters in production');
  }
  return new TextEncoder().encode(secret || 'dev-jwt-secret-insecure-fallback-do-not-use-in-prod');
}

export function getRefreshSecret(): Uint8Array {
  const secret = process.env.REFRESH_TOKEN_SECRET?.trim() || process.env.REFRESH_SECRET?.trim();
  if (secret && secret.length >= 32) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('REFRESH_TOKEN_SECRET environment variable is missing or shorter than 32 characters in production');
  }
  return new TextEncoder().encode(secret || 'dev-refresh-secret-insecure-fallback-do-not-use-in-prod');
}

/**
 * Edge-runtime compatible token verification using jose (Web Crypto API).
 * Verifies access tokens or refresh tokens without Node.js crypto dependencies.
 */
export async function verifyTokenEdge(token: string): Promise<EdgeTokenPayload | null> {
  if (!token || typeof token !== 'string') return null

  // 1. Try verifying against JWT_SECRET (Access Token)
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as EdgeTokenPayload
  } catch {
    // 2. Try verifying against REFRESH_TOKEN_SECRET (Refresh Token in session cookie)
    try {
      const { payload } = await jwtVerify(token, getRefreshSecret())
      return payload as EdgeTokenPayload
    } catch {
      return null
    }
  }
}
