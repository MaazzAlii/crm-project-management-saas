'use client'

import { Check, Sparkles } from 'lucide-react'

interface ChoosePlanStepProps {
  selectedPlan: string
  setSelectedPlan: (plan: string) => void
  onNext: () => void
  onBack: () => void
}

const PLANS = [
  {
    slug: 'starter',
    name: 'Starter Plan',
    price: '$29',
    period: '/month',
    features: ['Up to 5 team members', '25 clients', '50 active projects', 'Basic CRM & PM'],
    badge: null,
  },
  {
    slug: 'pro',
    name: 'Pro Plan',
    price: '$79',
    period: '/month',
    features: ['Up to 15 team members', '100 clients', '250 projects', 'AI Reply & Lead Scoring', 'Unified Inbox'],
    badge: 'Popular',
  },
  {
    slug: 'enterprise',
    name: 'Enterprise Plan',
    price: '$199',
    period: '/month',
    features: ['Unlimited team members', 'Unlimited clients', 'AI Task Extraction', 'Full Automation Hub', 'Dedicated VPS Storage'],
    badge: 'Full Power',
  },
]

export default function ChoosePlanStep({
  selectedPlan,
  setSelectedPlan,
  onNext,
  onBack,
}: ChoosePlanStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">
          Choose your workspace plan
        </h3>
        <p className="text-sm text-slate-400">
          All new organizations start with a 14-day free trial on any plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.slug
          return (
            <div
              key={plan.slug}
              onClick={() => setSelectedPlan(plan.slug)}
              className={`relative cursor-pointer rounded-2xl p-5 border transition-all ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                  {plan.badge}
                </span>
              )}
              <h4 className="font-bold text-white text-base mb-1">{plan.name}</h4>
              <div className="flex items-baseline mb-4">
                <span className="text-2xl font-black text-white">{plan.price}</span>
                <span className="text-slate-400 text-xs ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-4 text-xs text-slate-300">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

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
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start 14-Day Free Trial</span>
        </button>
      </div>
    </div>
  )
}
