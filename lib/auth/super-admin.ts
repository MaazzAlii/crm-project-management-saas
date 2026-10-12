import { queryOne } from '@/lib/db'
import { getCurrentSessionContext } from '@/lib/auth/session'

export async function isSuperAdmin(userId?: string): Promise<boolean> {
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

    if (superAdminRecord) return true

    const userRecord = await queryOne<{ role: string }>(
      'SELECT role FROM users WHERE id = $1',
      [targetUserId]
    )

    if (userRecord && userRecord.role === 'super_admin') {
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
