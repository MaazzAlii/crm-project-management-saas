'use client'

import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'

interface OnboardingCompleteStepProps {
  orgName: string
  loading: boolean
  onFinish: () => void
}

export default function OnboardingCompleteStep({
  orgName,
  loading,
  onFinish,
}: OnboardingCompleteStepProps) {
  return (
    <div className="text-center space-y-6 py-4">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {orgName || 'Workspace'} is Ready!
        </h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Your self-hosted CRM & Project Management workspace is configured and ready for active projects.
        </p>
      </div>

      <div className="pt-4 flex justify-center">
        <button
          onClick={onFinish}
          disabled={loading}
          className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Finalizing Workspace...</span>
            </>
          ) : (
            <>
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
