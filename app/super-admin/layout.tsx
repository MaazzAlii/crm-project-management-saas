import { createClient } from '@/lib/supabase/server'
import { SuperAdminNav } from '@/components/super-admin/super-admin-nav'
import { requireSuperAdmin } from '@/lib/auth/super-admin'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSuperAdmin()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      <SuperAdminNav userEmail={user?.email} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
