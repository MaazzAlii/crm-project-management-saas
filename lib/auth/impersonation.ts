import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getCookieSecure, getCookieDomain } from './session'
import { getJwtSecret } from './jwt'

export const ORIGIN_COOKIE_NAME = 'innoventix_super_admin_origin'
export const LEGACY_COOKIE_NAME = 'impersonation_session'
const ONE_HOUR_MS = 60 * 60 * 1000

export interface SuperAdminOriginTokenPayload {
  superAdminId: string
  superAdminEmail: string
  impersonatedUserId: string
  impersonatedUserEmail: string
  impersonatedUserName?: string | null
  impersonatedOrgId: string
  impersonatedOrgName: string
  startedAt: string
  expiresAt: string
}

export interface ImpersonationContext {
  active: boolean
  orgId: string | null
  orgName: string | null
  expiresAt: string | null
  userName?: string | null
  userEmail?: string | null
  superAdminId?: string | null
}

/**
 * Returns the secret used to sign the super admin origin cookie.
 * Request-time evaluation strictly complying with Rule 21.
 * 
 * In production: throws an error with code 'CONFIG_ERROR' if missing.
 * In development/test: falls back to JWT_SECRET with a console warning.
 */
export function getImpersonationOriginSecret(): string {
  const secret = process.env.IMPERSONATION_ORIGIN_SECRET?.trim()
  if (secret && secret.length >= 32) {
    return secret
  }

  if (process.env.NODE_ENV === 'production') {
    const error: any = new Error(
      'Server configuration error: IMPERSONATION_ORIGIN_SECRET is missing or shorter than 32 characters in production'
    )
    error.code = 'CONFIG_ERROR'
    throw error
  }

  console.warn(
    '[SECURITY WARNING] IMPERSONATION_ORIGIN_SECRET missing. Falling back to JWT_SECRET in development.'
  )
  return getJwtSecret()
}

/**
 * Cryptographically signs the super admin origin token.
 */
export function signOriginToken(payload: SuperAdminOriginTokenPayload): string {
  const secret = getImpersonationOriginSecret()
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: 3600,
  })
}

/**
 * Verifies and decodes the super admin origin token.
 */
export function verifyOriginToken(token: string): SuperAdminOriginTokenPayload | null {
  try {
    const secret = getImpersonationOriginSecret()
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as SuperAdminOriginTokenPayload

    const expiresAtMs = new Date(decoded.expiresAt).getTime()
    if (Date.now() > expiresAtMs) {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

/**
 * Reads the active origin cookie from the request and verifies its cryptographic signature.
 */
export async function getImpersonationOriginContext(): Promise<SuperAdminOriginTokenPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(ORIGIN_COOKIE_NAME)?.value
    if (!token) {
      return null
    }
    return verifyOriginToken(token)
  } catch {
    return null
  }
}

/**
 * Returns the active impersonation context for UI banners and components.
 */
export async function getImpersonationContext(): Promise<ImpersonationContext> {
  const origin = await getImpersonationOriginContext()
  if (origin) {
    return {
      active: true,
      orgId: origin.impersonatedOrgId,
      orgName: origin.impersonatedOrgName,
      expiresAt: origin.expiresAt,
      userName: origin.impersonatedUserName,
      userEmail: origin.impersonatedUserEmail,
      superAdminId: origin.superAdminId,
    }
  }

  // Legacy fallback if legacy cookie still exists
  try {
    const cookieStore = await cookies()
    const rawLegacy = cookieStore.get(LEGACY_COOKIE_NAME)?.value
    if (rawLegacy) {
      const parsed = JSON.parse(rawLegacy)
      const expiresAtMs = new Date(parsed.expiresAt).getTime()
      if (Date.now() <= expiresAtMs) {
        return {
          active: true,
          orgId: parsed.orgId || null,
          orgName: parsed.orgName || null,
          expiresAt: parsed.expiresAt || null,
        }
      }
    }
  } catch {}

  return { active: false, orgId: null, orgName: null, expiresAt: null }
}

export async function isImpersonating(): Promise<boolean> {
  const ctx = await getImpersonationContext()
  return ctx.active
}

/**
 * Sets the signed origin cookie on the response store.
 */
export async function setOriginCookie(payload: SuperAdminOriginTokenPayload): Promise<void> {
  const token = signOriginToken(payload)
  const cookieStore = await cookies()
  cookieStore.set(ORIGIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: getCookieSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
    domain: getCookieDomain(),
  })
}

/**
 * Clears the origin cookie and any legacy impersonation cookies.
 */
export async function clearOriginCookie(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(ORIGIN_COOKIE_NAME)
    cookieStore.delete(LEGACY_COOKIE_NAME)
  } catch {}
}

/**
 * Legacy compatibility helper.
 */
export async function setImpersonationCookie(orgId: string, orgName: string): Promise<string> {
  const expiresAt = new Date(Date.now() + ONE_HOUR_MS).toISOString()
  const payload = JSON.stringify({ orgId, orgName, expiresAt })

  const cookieStore = await cookies()
  cookieStore.set(LEGACY_COOKIE_NAME, payload, {
    httpOnly: true,
    secure: getCookieSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
    domain: getCookieDomain(),
  })

  return expiresAt
}

export async function clearImpersonationCookie(): Promise<void> {
  await clearOriginCookie()
}

/**
 * Guardrail 2: Destructive actions while impersonating require typed organization name confirmation.
 * Throws TYPED_CONFIRMATION_REQUIRED if impersonating and confirmation is missing or mismatched.
 */
export function assertDestructiveActionAllowed(session: any, confirmOrgName?: string): void {
  if (session?.impersonation?.isImpersonated) {
    const expectedName = session.organization?.name?.trim() || ''
    const typedName = confirmOrgName?.trim() || ''

    if (!typedName || typedName !== expectedName) {
      const err: any = new Error(
        `TYPED_CONFIRMATION_REQUIRED: You must type the organization name '${expectedName}' to confirm this destructive action while impersonating.`
      )
      err.code = 'TYPED_CONFIRMATION_REQUIRED'
      err.status = 400
      throw err
    }
  }
}
