import Link from 'next/link'
import { AlertTriangle, Mail, ShieldAlert } from 'lucide-react'

export default function OrgSuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900/90 p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Organization Access Suspended</h1>
          <p className="text-xs text-slate-400">
            Access to this organization has been temporarily suspended by the platform administrator or support team.
          </p>
        </div>

        <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 text-left text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-rose-300">
            <ShieldAlert className="h-4 w-4" />
            What this means:
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>Dashboard and project management features are temporarily locked.</li>
            <li>Your stored data remains intact and secure.</li>
            <li>Billing and terms review may be required to restore access.</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <a
            href="mailto:support@innoventixhub.com"
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-lg transition-all"
          >
            <Mail className="h-4 w-4" />
            Contact Innoventix Support
          </a>

          <Link
            href="/login"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
