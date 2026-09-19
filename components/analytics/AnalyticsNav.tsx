'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, DollarSign, Gauge } from 'lucide-react'

export function AnalyticsNav() {
  const pathname = usePathname()

  const tabs = [
    {
      label: 'Executive Overview',
      href: '/analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      active: pathname === '/analytics',
    },
    {
      label: 'Revenue & Financials',
      href: '/analytics/revenue',
      icon: <DollarSign className="w-4 h-4" />,
      active: pathname.startsWith('/analytics/revenue'),
    },
    {
      label: 'Plan & Resource Quotas',
      href: '/analytics/plan-usage',
      icon: <Gauge className="w-4 h-4" />,
      active: pathname.startsWith('/analytics/plan-usage'),
    },
  ]

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl max-w-fit shadow-inner">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tab.active
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </Link>
      ))}
    </div>
  )
}
