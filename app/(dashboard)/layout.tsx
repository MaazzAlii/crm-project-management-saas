import { redirect } from 'next/navigation'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { DashboardShell } from '@/components/shell/DashboardShell'
import { ensureAutoMigrated } from '@/lib/db/auto-migrate'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await ensureAutoMigrated()
  } catch (err) {
    console.warn('[DashboardLayout] Auto-migrate check error:', err)
  }

  const sessionContext = await getCurrentSessionContext()

  // Defensive Guard 1: Must be authenticated
  if (!sessionContext || !sessionContext.user) {
    redirect('/login')
  }

  // Defensive Guard 2: Must belong to an organization
  if (!sessionContext.organization) {
    redirect('/onboarding')
  }

  return (
    <DashboardShell sessionContext={sessionContext}>
      {children}
    </DashboardShell>
  )
}
