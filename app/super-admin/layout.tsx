import { SuperAdminNav } from '@/components/super-admin/super-admin-nav'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { getCurrentSessionContext } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSuperAdmin()
  const session = await getCurrentSessionContext()

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      <SuperAdminNav userEmail={session?.user?.email || 'admin@innoventix.io'} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
