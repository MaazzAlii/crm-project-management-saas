import { cookies } from 'next/headers'
import { queryOne } from '@/lib/db'
import { getCurrentSessionContext } from '@/lib/auth/session'

export async function isSuperAdmin(userId?: string): Promise<boolean> {
  const isDevAllowed =
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_DEV_AUTH_BYPASS === 'true'
  try {
    const cookieStore = cookies()
    const devSuperAdminCookie = cookieStore.get('dev_super_admin')
    if (isDevAllowed && (devSuperAdminCookie?.value === 'true' || process.env.DEV_SUPER_ADMIN === 'true')) {
      return true
    }
  } catch {}

  try {
    let targetUserId = userId
    if (!targetUserId) {
      const session = await getCurrentSessionContext()
      if (!session || !session.user) return false
      if (session.isSuperAdmin) return true
      targetUserId = session.user.id
    }

    const superAdminRecord = await queryOne<{ id: string }>(
      'SELECT id FROM super_admins WHERE user_id = $1',
      [targetUserId]
    )

    return !!superAdminRecord
  } catch {
    return false
  }
}

export async function requireSuperAdmin() {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    throw new Error('Access Denied: Super Admin privileges required for platform management.')
  }
  return true
}
