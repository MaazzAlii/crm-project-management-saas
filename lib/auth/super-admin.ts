import { queryOne } from '@/lib/db'
import { getCurrentSessionContext } from '@/lib/auth/session'

export const SUPER_ADMIN_EMAILS = [
  'innoventixhub@gmail.com',
  'maazalisshahid@gmail.com',
]

export async function isSuperAdmin(userId?: string): Promise<boolean> {
  try {
    let targetUserId = userId
    if (!targetUserId) {
      const session = await getCurrentSessionContext()
      if (!session || !session.user) return false
      if (session.user.email && SUPER_ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
        return true
      }
      if (session.isSuperAdmin) return true
      targetUserId = session.user.id
    }

    const superAdminRecord = await queryOne<{ id: string }>(
      'SELECT id FROM super_admins WHERE user_id = $1',
      [targetUserId]
    )

    if (superAdminRecord) return true

    const userRecord = await queryOne<{ email: string; role: string }>(
      'SELECT email, role FROM users WHERE id = $1',
      [targetUserId]
    )

    if (
      userRecord &&
      (userRecord.role === 'super_admin' ||
        (userRecord.email && SUPER_ADMIN_EMAILS.includes(userRecord.email.toLowerCase())))
    ) {
      return true
    }

    return false
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
