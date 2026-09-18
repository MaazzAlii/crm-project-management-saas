import { requirePortalSession } from '@/lib/portal/auth'
import { createClient } from '@/lib/supabase/server'
import { PortalNav } from '@/components/client-portal/PortalNav'
import { FileText, CheckCircle, Clock, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Invoices — Client Portal',
  description: 'View your invoice and payment history.',
}

type InvoiceStatus = 'invoiced' | 'paid' | 'overdue' | 'delivered'

interface DerivedInvoice {
  id: string
  title: string
  amount: number
  currency: string
  status: InvoiceStatus
  deliveredAt: string | null
  deadline: string | null
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  paid: {
    label: 'Paid',
    icon: CheckCircle,
    className: 'inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20',
  },
  invoiced: {
    label: 'Invoice Sent',
    icon: Clock,
    className: 'inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-2.5 py-1 text-xs font-medium text-cyan-400 ring-1 ring-cyan-500/20',
  },
  overdue: {
    label: 'Overdue',
    icon: AlertTriangle,
    className: 'inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/20',
  },
  delivered: {
    label: 'Delivered (Invoice Pending)',
    icon: Clock,
    className: 'inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20',
  },
}

function deriveStatus(project: { status: string; deadline: string | null; delivered_at: string | null }): InvoiceStatus {
  if (project.status === 'paid') return 'paid'
  if (project.status === 'invoiced') {
    // Check if past deadline → overdue
    if (project.deadline && new Date(project.deadline) < new Date()) return 'overdue'
    return 'invoiced'
  }
  return 'delivered'
}

export default async function PortalInvoicesPage() {
  const { clientId, organizationId } = await requirePortalSession()
  const supabase = await createClient()

  const [{ data: projects }, { data: org }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, amount, currency, status, deadline, delivered_at, invoice_triggered')
      .eq('client_id', clientId)
      .in('status', ['delivered', 'invoiced', 'paid'])
      .or('invoice_triggered.eq.true')
      .order('delivered_at', { ascending: false }),

    supabase
      .from('organizations')
      .select('name, logo_url')
      .eq('id', organizationId)
      .maybeSingle(),
  ])

  // Map projects → derived invoice objects
  const invoices: DerivedInvoice[] = (projects ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    amount: Number(p.amount),
    currency: p.currency ?? 'USD',
    status: deriveStatus(p),
    deliveredAt: p.delivered_at,
    deadline: p.deadline,
  }))

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.amount, 0)
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((acc, inv) => acc + inv.amount, 0)
  const totalOutstanding = totalInvoiced - totalPaid
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length

  const orgName = (org as any)?.name ?? 'Client Portal'
  const orgLogoUrl = (org as any)?.logo_url ?? null

  return (
    <div className="portal-bg min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-violet-600/8 blur-3xl" />
      </div>

      <PortalNav orgName={orgName} orgLogoUrl={orgLogoUrl} />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="h-6 w-6 text-violet-400" />
            Invoices & Payments
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Your billing history and payment status.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: DollarSign,
              value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalInvoiced),
              label: 'Total Invoiced',
              color: 'text-cyan-400',
              bg: 'bg-cyan-500/15 ring-cyan-500/20',
            },
            {
              icon: CheckCircle,
              value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPaid),
              label: 'Total Paid',
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/15 ring-emerald-500/20',
            },
            {
              icon: TrendingUp,
              value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalOutstanding),
              label: `Outstanding${overdueCount > 0 ? ` (${overdueCount} overdue)` : ''}`,
              color: overdueCount > 0 ? 'text-red-400' : 'text-amber-400',
              bg: overdueCount > 0 ? 'bg-red-500/15 ring-red-500/20' : 'bg-amber-500/15 ring-amber-500/20',
            },
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <div key={label} className="portal-card flex items-center gap-4 py-5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-white leading-tight">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Invoice list */}
        {invoices.length === 0 ? (
          <div className="portal-card text-center py-16">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/15 ring-1 ring-violet-500/20">
              <FileText className="h-7 w-7 text-violet-400" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">No invoices yet</h2>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Invoices will appear here once your projects are delivered and invoiced by the team.
            </p>
          </div>
        ) : (
          <div className="portal-card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Project</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hidden sm:table-cell">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {invoices.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.invoiced
                  const CfgIcon = cfg.icon
                  const date = inv.deliveredAt
                    ? new Date(inv.deliveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{inv.title}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-400 hidden sm:table-cell">{date}</td>
                      <td className="px-6 py-4 text-right font-semibold text-white">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency }).format(inv.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cfg.className}>
                          <CfgIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-center text-slate-600">
          For billing questions, contact your account manager.
        </p>
      </main>
    </div>
  )
}
