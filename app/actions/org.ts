'use server'

import { cookies } from 'next/headers'
import { getCookieSecure, getCookieDomain } from '@/lib/auth/session'

export async function setActiveOrgAction(orgId: string) {
  const cookieStore = cookies()
  cookieStore.set('active_org_id', orgId, {
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: 'lax',
    secure: getCookieSecure(),
    domain: getCookieDomain(),
  })
}
