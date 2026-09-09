'use client'

import { useState } from 'react'
import { UserPlus, X, Mail } from 'lucide-react'

interface InviteTeamStepProps {
  teamEmails: string[]
  setTeamEmails: React.Dispatch<React.SetStateAction<string[]>>
  onNext: () => void
  onBack: () => void
}

export default function InviteTeamStep({
  teamEmails,
  setTeamEmails,
  onNext,
  onBack,
}: InviteTeamStepProps) {
  const [currentEmail, setCurrentEmail] = useState('')

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentEmail.trim() && currentEmail.includes('@') && !teamEmails.includes(currentEmail)) {
      setTeamEmails([...teamEmails, currentEmail.trim()])
      setCurrentEmail('')
    }
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setTeamEmails(teamEmails.filter((email) => email !== emailToRemove))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">
          Invite your team members
        </h3>
        <p className="text-sm text-slate-400">
          Collaborate on clients, projects, and pipeline tasks together. (Optional)
        </p>
      </div>

      <form onSubmit={handleAddEmail} className="flex gap-2">
        <div className="relative flex-1 rounded-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="block w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {teamEmails.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Invited Colleagues ({teamEmails.length})
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {teamEmails.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between py-2 px-3 bg-slate-950/40 border border-slate-800/80 rounded-lg text-sm"
              >
                <span className="text-slate-300 font-medium">{email}</span>
                <button
                  onClick={() => handleRemoveEmail(email)}
                  className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-white transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all"
        >
          {teamEmails.length > 0 ? 'Continue' : 'Skip for now'}
        </button>
      </div>
    </div>
  )
}
