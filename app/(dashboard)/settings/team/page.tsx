import { getCurrentSessionContext } from '@/lib/auth/session'
import { query } from '@/lib/db'
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

  // Fetch all organization members with joined profile details
  const { rows: memberRows } = await query<any>(
    `SELECT om.id, om.user_id, om.role, om.joined_at, u.full_name, u.email, u.avatar_url
     FROM organization_members om
     JOIN users u ON u.id = om.user_id
     WHERE om.organization_id = $1
     ORDER BY om.created_at ASC`,
    [session.organization.id]
  )

  const members: MemberItem[] = (memberRows || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    profile: {
      fullName: row.full_name ?? null,
      email: row.email ?? 'Unspecified User',
      avatarUrl: row.avatar_url ?? null,
    },
  }))

  return (
    <TeamMemberList
      members={members}
      currentUserId={session.user.id}
      currentUserRole={session.role || 'member'}
      isSuperAdmin={session.isSuperAdmin}
    />
  )
}
