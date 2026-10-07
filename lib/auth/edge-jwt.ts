import { jwtVerify } from 'jose'

export interface EdgeTokenPayload {
  userId: string
  email?: string
  role?: 'user' | 'org_admin' | 'super_admin' | string
  orgId?: string
  tokenFamily?: string
  [key: string]: any
}

const DEFAULT_JWT_SECRET = 'd0a391b9da5876ead44bdbf4de07fa3cf73ebe0355f65521e9b902f256c4851f';
const DEFAULT_REFRESH_SECRET = 'fc75593f45889b1e6fbd283ab846b36d0b6998b4954097f3e8fc4d8c6adb5807';

function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_SECRET?.trim() || DEFAULT_JWT_SECRET
  )
}

function getRefreshSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.REFRESH_TOKEN_SECRET?.trim() || process.env.REFRESH_SECRET?.trim() || DEFAULT_REFRESH_SECRET
  )
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
