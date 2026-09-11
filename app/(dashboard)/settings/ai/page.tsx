import { Bot, Sparkles } from 'lucide-react'

export default function AISettingsPage() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center space-y-4 shadow-xl max-w-2xl mx-auto my-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
        <Bot className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-white">AI Assistant & Model Configuration</h2>
        <p className="mt-1 text-xs text-slate-400">
          Configure agency AI models, auto-reply suggestions, lead scoring prompts, and task extraction thresholds.
        </p>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/30">
        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
        AI Engine Active
      </div>
    </div>
  )
}
