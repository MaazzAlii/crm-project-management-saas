import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function isSuperAdmin(userId?: string): Promise<boolean> {
  const isDevAllowed =
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_DEV_AUTH_BYPASS === 'true'
  const cookieStore = cookies()
  const devSuperAdminCookie = cookieStore.get('dev_super_admin')
  if (isDevAllowed && (devSuperAdminCookie?.value === 'true' || process.env.DEV_SUPER_ADMIN === 'true')) {
    return true
  }

  try {
    const supabase = await createClient()

    let targetUserId = userId

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      targetUserId = user.id
    }

    // Query strictly against the super_admins table — never joined through organization_members
    const { data: superAdminRecord } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', targetUserId)
      .maybeSingle()

    return !!superAdminRecord
  } catch {
    // In dev environment when DB is offline, check dev cookie
    if (isDevAllowed) {
      return devSuperAdminCookie?.value === 'true' || process.env.DEV_SUPER_ADMIN === 'true'
    }
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
