'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { type UserSessionContext } from '@/lib/auth/session'

interface DashboardShellProps {
  sessionContext: UserSessionContext
  children: React.ReactNode
}

export function DashboardShell({ sessionContext, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Persistent Sidebar */}
      <Sidebar
        isSuperAdmin={sessionContext.isSuperAdmin}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar
          sessionContext={sessionContext}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
