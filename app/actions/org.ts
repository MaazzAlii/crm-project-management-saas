'use server'

import { cookies } from 'next/headers'

export async function setActiveOrgAction(orgId: string) {
  const cookieStore = cookies()
  cookieStore.set('active_org_id', orgId, {
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}
