'use client'

import React, { useState } from 'react'
import {
  CreditCard,
  FileText,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Receipt,
  Download,
} from 'lucide-react'
import { createCustomerPortalSession } from '@/app/actions/stripe'

export interface InvoiceItem {
  id: string
  number: string
  amount: number
  status: string
  date: string
  pdfUrl?: string | null
}

interface BillingSettingsClientProps {
  isPro: boolean
  hasCustomer: boolean
  invoices: InvoiceItem[]
  organizationName: string
}

export function BillingSettingsClient({
  isPro,
  hasCustomer,
  invoices,
  organizationName,
}: BillingSettingsClientProps) {
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    try {
      setLoading('checkout')
      setError(null)
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.message || data.error || 'Failed to initialize checkout')
      }
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message || 'Error redirecting to Stripe Checkout')
      setLoading(null)
    }
  }

  const handlePortal = async () => {
    try {
      setLoading('portal')
      setError(null)
      const res = await createCustomerPortalSession()
      if (res.url) {
        window.location.href = res.url
      } else {
        throw new Error(res.error || 'Failed to open customer portal')
      }
    } catch (err: any) {
      setError(err.message || 'Error opening billing portal')
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8" data-testid="billing-settings-client">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Subscription Action Section (Prompt 48) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-sky-400" />
            Subscription Management
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isPro
              ? 'Your workspace is currently subscribed to the Pro plan.'
              : 'Upgrade to Innoventix Pro to unlock 15 seats, custom domain, and priority delivery.'}
          </p>
        </div>

        {/* Free org sees Upgrade to Pro; Pro org (or org with customer) sees Manage subscription */}
        <div>
          {isPro || hasCustomer ? (
            <button
              type="button"
              data-testid="manage-subscription-button"
              disabled={loading === 'portal'}
              onClick={handlePortal}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-700 transition disabled:opacity-50 cursor-pointer"
            >
              {loading === 'portal' ? (
                <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Manage subscription
            </button>
          ) : (
            <button
              type="button"
              data-testid="upgrade-pro-button"
              disabled={loading === 'checkout'}
              onClick={handleUpgrade}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50 cursor-pointer"
            >
              {loading === 'checkout' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>

      {/* Recent Invoices Table (Prompt 48) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt className="h-4 w-4 text-sky-400" />
            Recent Invoices
          </h3>
          <p className="text-xs text-slate-400">
            Payment history and downloadable tax receipts for {organizationName}.
          </p>
        </div>

        {invoices.length === 0 ? (
          <div
            data-testid="empty-invoices-state"
            className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-400 space-y-1"
          >
            <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">No invoices found for this organization.</p>
            <p className="text-slate-500 text-[11px]">
              When subscription charges occur, your official receipts will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" data-testid="invoices-table">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-white font-medium">{inv.number}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(inv.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-white font-bold">${inv.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.pdfUrl ? (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300"
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
