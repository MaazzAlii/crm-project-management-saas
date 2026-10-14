import Link from 'next/link'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ClientForm } from '@/components/clients/ClientForm'
import { ArrowLeft, Users } from 'lucide-react'

import { hasActiveChannels } from '@/lib/clients/communication-mode'

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
      <div className="rounded-2xl border border-border bg-card/50 p-8 text-center text-muted-foreground">
        No active organization selected. Please choose or create an organization first.
      </div>
    )
  }

  const orgHasChannels = await hasActiveChannels(session.organization.id)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-2">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Clients Directory</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Add New Client</h1>
            <p className="text-xs text-muted-foreground">
              Create a client entry and choose between Manual mode or Connected Hub auto-sync.
            </p>
          </div>
        </div>
      </div>

      {/* Client Creation Form */}
      <ClientForm initialMode="connected" hasActiveChannels={orgHasChannels} />
    </div>
  )
}
