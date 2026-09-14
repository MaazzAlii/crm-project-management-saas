import { cookies } from 'next/headers'

export interface ImpersonationContext {
  active: boolean
  orgId: string | null
  orgName: string | null
  expiresAt: string | null
}

const COOKIE_NAME = 'impersonation_session'
const ONE_HOUR_MS = 60 * 60 * 1000

export async function getImpersonationContext(): Promise<ImpersonationContext> {
  const cookieStore = cookies()
  const rawCookie = cookieStore.get(COOKIE_NAME)?.value

  if (!rawCookie) {
    return { active: false, orgId: null, orgName: null, expiresAt: null }
  }

  try {
    const parsed = JSON.parse(rawCookie)
    const expiresAtMs = new Date(parsed.expiresAt).getTime()

    if (Date.now() > expiresAtMs) {
      return { active: false, orgId: null, orgName: null, expiresAt: null }
    }

    return {
      active: true,
      orgId: parsed.orgId || null,
      orgName: parsed.orgName || null,
      expiresAt: parsed.expiresAt || null,
    }
  } catch {
    return { active: false, orgId: null, orgName: null, expiresAt: null }
  }
}

export async function isImpersonating(): Promise<boolean> {
  const ctx = await getImpersonationContext()
  return ctx.active
}

export async function assertNotImpersonating(): Promise<void> {
  const active = await isImpersonating()
  if (active) {
    throw new Error('Support Access is Read-Only. Cannot modify tenant data while in Support Mode.')
  }
}

export async function setImpersonationCookie(orgId: string, orgName: string): Promise<string> {
  const expiresAt = new Date(Date.now() + ONE_HOUR_MS).toISOString()
  const payload = JSON.stringify({ orgId, orgName, expiresAt })

  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  })

  return expiresAt
}

export async function clearImpersonationCookie(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete(COOKIE_NAME)
}
