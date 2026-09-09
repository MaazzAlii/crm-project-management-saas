'use client'

import { Building2, Layers } from 'lucide-react'

interface OrgDetailsStepProps {
  orgName: string
  setOrgName: (val: string) => void
  industryType: string
  setIndustryType: (val: string) => void
  onNext: () => void
}

const INDUSTRIES = [
  'UGC & Creative Media Agency',
  'AI & Voice Agent Integrator',
  'Workflow & Automation Studio (n8n/Make)',
  'Digital Marketing & Advertising Agency',
  'Software Development & IT Consultancy',
  'General SMB Services',
]

export default function OrgDetailsStep({
  orgName,
  setOrgName,
  industryType,
  setIndustryType,
  onNext,
}: OrgDetailsStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (orgName.trim()) {
      onNext()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">
          Tell us about your organization
        </h3>
        <p className="text-sm text-slate-400">
          Configure your workspace title and primary business category.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Organization Name
          </label>
          <div className="relative rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Building2 className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Innoventix Hub"
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Industry / Business Category
          </label>
          <div className="relative rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Layers className="w-5 h-5" />
            </div>
            <select
              value={industryType}
              onChange={(e) => setIndustryType(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind} className="bg-slate-900 text-slate-100">
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all"
        >
          Continue
        </button>
      </div>
    </form>
  )
}
