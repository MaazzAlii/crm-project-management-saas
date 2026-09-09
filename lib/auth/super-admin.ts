import { createClient } from '@/lib/supabase/server'

export async function isSuperAdmin(userId?: string): Promise<boolean> {
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
}

export async function requireSuperAdmin() {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    throw new Error('Access Denied: Super Admin privileges required for platform management.')
  }
  return true
}
