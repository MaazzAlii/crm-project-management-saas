import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { getOrganizationPlanUsageDetails } from '@/lib/billing/plan-limits'
import { AnalyticsNav, PlanUsageCard } from '@/components/analytics'
import { Gauge, Check, Zap, ArrowUpRight, ShieldCheck, HardDrive, Users, Briefcase } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Plan Usage & Quota Intelligence | Innoventix Hub',
  description: 'Monitor subscription tier resource utilization, team quotas, and capacity limits.',
}

export default async function PlanUsageAnalyticsPage() {
  const session = await getCurrentSessionContext()

  if (!session || !session.organization) {
    redirect('/login')
  }

  const orgId = session.organization.id
  const usage = await getOrganizationPlanUsageDetails(orgId)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header and Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Gauge className="w-6 h-6 text-blue-400" />
            <span>Subscription Quotas & Resource Usage</span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time tracking of team members, clients, storage, and API quotas against your plan.
          </p>
        </div>

        {/* Tab Navigation */}
        <AnalyticsNav />
      </div>

      {/* Main Plan Usage Card */}
      <PlanUsageCard usage={usage} showUpgradeButton={true} />

      {/* Tier Comparison & Upgrade Recommendations */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Available Subscription Tiers & Scale Limits</span>
            </h3>
            <p className="text-xs text-slate-400">
              Need more team capacity or AI capabilities? Scale your plan seamlessly.
            </p>
          </div>
          <Link
            href="/settings/billing"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Go to Billing Management</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Plan */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white">Starter</h4>
              <span className="text-xs font-mono text-slate-400">$29/mo</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" /> Up to 5 team members
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" /> 25 active clients
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" /> 50 projects & 10GB storage
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="bg-blue-950/20 border border-blue-500/50 rounded-xl p-5 space-y-4 relative">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white">Pro</h4>
              <span className="text-xs font-mono text-blue-400 font-bold">$79/mo</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" /> Up to 15 team members
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" /> 100 active clients
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" /> AI Reply & Lead Scoring
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" /> 3 connected channels
              </li>
            </ul>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white">Enterprise</h4>
              <span className="text-xs font-mono text-emerald-400 font-bold">$199/mo</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Unlimited team members & clients
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> AI Task Extraction & Reports
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Unlimited channels & VPS storage
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
