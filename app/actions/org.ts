'use server'

import { cookies } from 'next/headers'
import { getCookieSecure, getCookieDomain } from '@/lib/auth/session'

import { queryOne } from '@/lib/db'
import { getCurrentSessionContext } from '@/lib/auth/session'

export async function setActiveOrgAction(orgId: string) {
  const session = await getCurrentSessionContext()
  if (!session || !session.user) {
    throw new Error('Unauthorized')
  }

  // Super admins have platform-wide access to any organization
  if (!session.isSuperAdmin) {
    const membership = await queryOne(
      `SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
      [orgId, session.user.id]
    )
    if (!membership) {
      throw new Error('You are not a member of this organization')
    }
  }

  const cookieStore = cookies()
  cookieStore.set('active_org_id', orgId, {
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: 'lax',
    secure: getCookieSecure(),
    domain: getCookieDomain(),
  })
}

