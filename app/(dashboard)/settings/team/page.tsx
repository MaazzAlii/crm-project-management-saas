import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamMemberList, MemberItem } from '@/components/settings/TeamMemberList'

export const dynamic = 'force-dynamic'

export default async function TeamSettingsPage() {
  const session = await getCurrentSessionContext()

  if (!session || !session.user) {
    redirect('/login')
  }

  if (!session.organization) {
    redirect('/onboarding')
  }

  const supabase = await createClient()

  // Fetch all organization members with joined profile details
  const { data: memberRows } = await supabase
    .from('organization_members')
    .select(`
      id,
      user_id,
      role,
      joined_at,
      profiles!organization_members_user_id_fkey (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('organization_id', session.organization.id)
    .order('created_at', { ascending: true })

  const members: MemberItem[] = (memberRows || []).map((row: any) => {
    const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      userId: row.user_id,
      role: row.role,
      joinedAt: row.joined_at,
      profile: {
        fullName: prof?.full_name ?? null,
        email: prof?.email ?? 'Unspecified User',
        avatarUrl: prof?.avatar_url ?? null,
      },
    }
  })

  return (
    <TeamMemberList
      members={members}
      currentUserId={session.user.id}
      currentUserRole={session.role || 'member'}
      isSuperAdmin={session.isSuperAdmin}
    />
  )
}
