import { getCurrentSessionContext } from '@/lib/auth/session'
import { query } from '@/lib/db'
import { redirect } from 'next/navigation'
import { TeamMemberList, MemberItem } from '@/components/settings/TeamMemberList'
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner'
import { PlanUsageCard } from '@/components/billing/PlanUsageCard'

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
    <div className="space-y-6">
      {/* Email Verification Banner (Prompt 39) */}
      <EmailVerificationBanner
        isVerified={session.user.email_verified}
        userEmail={session.user.email}
      />

      {/* Plan Usage & Seat Capacity Card (Prompt 40 & 41) */}
      <PlanUsageCard />

      {/* Team Member List & Pending Invitations (Prompts 34, 35, 36) */}
      <TeamMemberList
        members={members}
        currentUserId={session.user.id}
        currentUserRole={session.role || 'member'}
        isSuperAdmin={session.isSuperAdmin}
      />
    </div>
  )
}
