import { redirect } from 'next/navigation'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { fetchAIFeatureSettingsAction } from './actions'
import { AIFeatureSettingsView } from '@/components/settings/AIFeatureSettingsView'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'AI Settings & Usage Controls | Agency Workspace',
  description: 'Manage per-feature AI capabilities, inspect token consumption, and audit costs.',
}

export default async function AISettingsPage() {
  const session = await getCurrentSessionContext()

  if (!session || !session.user) {
    redirect('/login')
  }

  if (!session.organization) {
    redirect('/onboarding')
  }

  const result = await fetchAIFeatureSettingsAction()

  if (!result.success || !result.data) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-300">
        <p className="font-semibold">Unable to load AI settings</p>
        <p className="text-xs text-rose-400/80 mt-1">{result.error || 'Unknown error occurred'}</p>
      </div>
    )
  }

  return <AIFeatureSettingsView initialData={result.data} />
}
