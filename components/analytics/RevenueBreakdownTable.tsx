'use client'

import { useState } from 'react'
import {
  Search,
  Download,
  Printer,
  ArrowUpDown,
  ChevronDown,
  Building2,
  DollarSign,
  Briefcase,
  CheckCircle2,
} from 'lucide-react'
import type { RevenueByClientMetric } from '@/lib/analytics/data'

interface RevenueBreakdownTableProps {
  clients: RevenueByClientMetric[]
  organizationName?: string
}

type SortField = 'clientName' | 'totalBilled' | 'paidAmount' | 'invoicedAmount' | 'projectsCount'
type SortOrder = 'asc' | 'desc'

export function RevenueBreakdownTable({
  clients,
  organizationName = 'Agency Hub',
}: RevenueBreakdownTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('totalBilled')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const filteredClients = clients
    .filter((c) => {
      const matchesSearch =
        c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1
      if (sortField === 'clientName') {
        return multiplier * a.clientName.localeCompare(b.clientName)
      }
      return multiplier * ((a[sortField] || 0) - (b[sortField] || 0))
    })

  const exportCSV = () => {
    const headers = [
      'Client Name',
      'Company',
      'Email',
      'Status',
      'Projects Count',
      'Active Pipeline ($)',
      'Invoiced ($)',
      'Paid ($)',
      'Total Billed ($)',
    ]

    const rows = filteredClients.map((c) => [
      `"${c.clientName.replace(/"/g, '""')}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      `"${c.email || ''}"`,
      c.status,
      c.projectsCount,
      c.activeAmount,
      c.invoicedAmount,
      c.paidAmount,
      c.totalBilled,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `revenue-report-${organizationName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const totalFilteredBilled = filteredClients.reduce((acc, c) => acc + c.totalBilled, 0)
  const totalFilteredPaid = filteredClients.reduce((acc, c) => acc + c.paidAmount, 0)
  const totalFilteredInvoiced = filteredClients.reduce((acc, c) => acc + c.invoicedAmount, 0)

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Client Revenue & Account Breakdown</span>
          </h3>
          <p className="text-xs text-slate-400">
            Sortable financial ledger breakdown per client and active project.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-48"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>

          {/* CSV Export */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Print PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors print:hidden"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-800">
            <tr>
              <th
                onClick={() => handleSort('clientName')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Client & Company</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('projectsCount')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Projects</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('invoicedAmount')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Invoiced</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('paidAmount')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Paid Revenue</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('totalBilled')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Value</span>
                  <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-900/40">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  No clients match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredClients.map((c) => (
                <tr key={c.clientId} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {c.clientName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{c.clientName}</p>
                        {c.company && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {c.company}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px]">
                      <Briefcase className="w-3 h-3 text-indigo-400" />
                      {c.projectsCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    ${c.invoicedAmount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                    ${c.paidAmount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                    ${c.totalBilled.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filteredClients.length > 0 && (
            <tfoot className="bg-slate-950/90 font-bold border-t border-slate-800 text-white">
              <tr>
                <td className="py-3 px-4">Summary Totals ({filteredClients.length} clients)</td>
                <td className="py-3 px-4 text-center">
                  {filteredClients.reduce((acc, c) => acc + c.projectsCount, 0)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-300">
                  ${totalFilteredInvoiced.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400">
                  ${totalFilteredPaid.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-white">
                  ${totalFilteredBilled.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
