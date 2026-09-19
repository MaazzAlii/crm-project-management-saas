import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface UserOrganizationItem {
  id: string
  name: string
  slug: string
  role: string
}

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
  userOrganizations: UserOrganizationItem[]
  role: 'owner' | 'admin' | 'member' | 'billing_manager' | null
  isSuperAdmin: boolean
}

export async function getCurrentSessionContext(): Promise<UserSessionContext | null> {
  const supabase = await createClient()

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch (err) {
    // In dev environment when Supabase local server is offline
  }

  let isDevAdmin = process.env.DEV_SUPER_ADMIN === 'true'
  try {
    const cookieStore = cookies()
    if (cookieStore.get('dev_super_admin')?.value === 'true') {
      isDevAdmin = true
    }
  } catch {}

  if (!user) {
    if (isDevAdmin) {
      return {
        user: {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'dev_admin@innoventixhub.com',
          full_name: 'Dev Super Admin',
          avatar_url: null,
        },
        organization: {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Innoventix Hub Agency',
          slug: 'innoventix-hub',
          plan_tier: 'agency_pro',
          billing_status: 'active',
        },
        userOrganizations: [
          {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Innoventix Hub Agency',
            slug: 'innoventix-hub',
            role: 'owner',
          },
        ],
        role: 'owner',
        isSuperAdmin: true,
      }
    }
    return null
  }

  // Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  // Fetch Super Admin Status
  const { data: superAdmin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isSuperAdmin = !!superAdmin || process.env.DEV_SUPER_ADMIN === 'true'

  // Fetch All Organization Memberships for this user
  const { data: allMemberships } = await supabase
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

  const userOrganizations: UserOrganizationItem[] = []
  let selectedMembership = null

  const cookieStore = cookies()
  const activeOrgId = cookieStore.get('active_org_id')?.value

  if (allMemberships && allMemberships.length > 0) {
    allMemberships.forEach((m: any) => {
      const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations
      if (org) {
        userOrganizations.push({
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: m.role,
        })
      }
    })

    if (activeOrgId) {
      selectedMembership = allMemberships.find((m: any) => {
        const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations
        return org && org.id === activeOrgId
      })
    }

    if (!selectedMembership) {
      selectedMembership = allMemberships[0]
    }
  }

  let organization = null
  let role = null

  if (selectedMembership && selectedMembership.organizations) {
    const org = Array.isArray(selectedMembership.organizations)
      ? selectedMembership.organizations[0]
      : selectedMembership.organizations

    organization = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan_tier: org.plan_tier,
      billing_status: org.billing_status,
    }
    role = selectedMembership.role as UserSessionContext['role']
  }

  return {
    user: {
      id: user.id,
      email: user.email!,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
    organization,
    userOrganizations,
    role,
    isSuperAdmin,
  }
}
