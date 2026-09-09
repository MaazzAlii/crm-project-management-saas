import { createClient } from '@/lib/supabase/server'

export interface UserSessionContext {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  organization: {
    id: string
    name: string
    slug: string
    plan_tier: string
    billing_status: string
  } | null
  role: 'owner' | 'admin' | 'member' | 'billing_manager' | null
  isSuperAdmin: boolean
}

export async function getCurrentSessionContext(): Promise<UserSessionContext | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return null
  }

  // Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  // Fetch Super Admin Status
  const { data: superAdmin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isSuperAdmin = !!superAdmin

  // Fetch Active Organization Membership
  const { data: memberRecord } = await supabase
    .from('organization_members')
    .select(`
      role,
      organizations (
        id,
        name,
        slug,
        plan_tier,
        billing_status
      )
    `)
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  let organization = null
  let role = null

  if (memberRecord && memberRecord.organizations) {
    // Type assertion for Supabase nested object join
    const org = Array.isArray(memberRecord.organizations)
      ? memberRecord.organizations[0]
      : memberRecord.organizations

    organization = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan_tier: org.plan_tier,
      billing_status: org.billing_status,
    }
    role = memberRecord.role as UserSessionContext['role']
  }

  return {
    user: {
      id: user.id,
      email: user.email!,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
    organization,
    role,
    isSuperAdmin,
  }
}
