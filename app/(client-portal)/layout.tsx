import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Client Portal',
  description: 'Secure client portal — view your projects, tasks, and deliverables.',
}

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#09090f] text-slate-900 dark:text-slate-100 transition-colors">
      {children}
    </div>
  )
}
