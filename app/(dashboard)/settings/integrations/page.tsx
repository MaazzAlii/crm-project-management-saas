import { Puzzle, Sparkles } from 'lucide-react'

export default function IntegrationsSettingsPage() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center space-y-4 shadow-xl max-w-2xl mx-auto my-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
        <Puzzle className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-white">Integrations & Webhooks</h2>
        <p className="mt-1 text-xs text-slate-400">
          Connect Slack, Google Workspace, GitHub, Stripe, and custom webhooks for automated workflows.
        </p>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 border border-slate-700">
        <Sparkles className="h-3.5 w-3.5 text-sky-400" />
        Integrations Engine Enabled
      </div>
    </div>
  )
}
