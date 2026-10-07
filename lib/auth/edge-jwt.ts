import { jwtVerify } from 'jose'

export interface EdgeTokenPayload {
  userId: string
  email?: string
  role?: 'user' | 'org_admin' | 'super_admin' | string
  orgId?: string
  tokenFamily?: string
  [key: string]: any
}

function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || 'dev-secret-32-chars-minimum-required'
  )
}

function getRefreshSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-32-chars-minimum-required'
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
