import Link from 'next/link'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ClientForm } from '@/components/clients/ClientForm'
import { ArrowLeft, Users } from 'lucide-react'

export const metadata = {
  title: 'New Client | INNOVENTIX Hub',
  description: 'Add a new client record and select communication mode for your agency tenant.',
}

export default async function NewClientPage() {
  const session = await getCurrentSessionContext()

  if (!session || !session.user) {
    redirect('/auth/signin')
  }

  if (!session.organization) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
        No active organization selected. Please choose or create an organization first.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-2">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-400 transition w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Clients Directory</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Add New Client</h1>
            <p className="text-xs text-slate-400">
              Create a client entry and choose between Manual mode or Connected Hub auto-sync.
            </p>
          </div>
        </div>
      </div>

      {/* Client Creation Form */}
      <ClientForm />
    </div>
  )
}
