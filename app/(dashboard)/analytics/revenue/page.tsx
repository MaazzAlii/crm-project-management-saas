import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { fetchRevenueReport, AnalyticsDateRange } from '@/lib/analytics/data'
import {
  AnalyticsNav,
  RevenueBreakdownTable,
  RevenueByClientChart,
  MonthlyTrendsChart,
} from '@/components/analytics'
import { DollarSign, ArrowUpRight, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Revenue Analytics & Reporting | Innoventix Hub',
  description: 'Detailed revenue breakdown by client, project type, and payment status.',
}

export default async function RevenueAnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string }
}) {
  const session = await getCurrentSessionContext()

  if (!session || !session.organization) {
    redirect('/login')
  }

  const orgId = session.organization.id
  const range = (searchParams?.range || '30d') as AnalyticsDateRange

  const report = await fetchRevenueReport(orgId, range)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation and Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <span>Revenue & Financial Analytics</span>
          </h1>
          <p className="text-sm text-slate-400">
            Track client billing, revenue realization, and service line profitability.
          </p>
        </div>

        {/* Tab Navigation */}
        <AnalyticsNav />
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pipeline & Contracted */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Booked Value</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black font-mono text-white">
            ${report.totalRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">All contracted projects</p>
        </div>

        {/* Realized Paid Revenue */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Realized Paid Revenue</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-400">
            ${report.paidRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">Settled and collected payments</p>
        </div>

        {/* Invoiced & Awaiting Payment */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Invoiced / Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-400">
            ${report.invoicedRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">Awaiting client payment</p>
        </div>

        {/* Average Deal Size */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Project Value</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black font-mono text-purple-400">
            ${report.averageDealSize.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">Mean contract size across projects</p>
        </div>
      </div>

      {/* Top Clients by Revenue & Project Types */}
      <RevenueByClientChart
        clients={report.clientsBreakdown}
        projectTypes={report.typeBreakdown}
        totalRevenue={report.totalRevenue}
      />

      {/* Monthly Trends Chart */}
      <MonthlyTrendsChart trends={report.monthlyTrends} />

      {/* Detailed Sortable/Filterable Client Breakdown Table */}
      <RevenueBreakdownTable
        clients={report.clientsBreakdown}
        organizationName={session.organization.name || 'Agency'}
      />
    </div>
  )
}
