import type { Metadata } from 'next'
import './globals.css'
import { SupportBannerWrapper } from '@/components/super-admin/support-banner-wrapper'

export const metadata: Metadata = {
  title: 'CRM & Project Management SaaS Platform',
  description: 'Multi-tenant SaaS platform combining CRM, Project Management, and Unified Communication Hub',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <SupportBannerWrapper />
        {children}
      </body>
    </html>
  )
}
