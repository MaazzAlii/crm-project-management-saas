import type { Metadata } from 'next'
import './globals.css'
import { SupportBannerWrapper } from '@/components/super-admin/support-banner-wrapper'
import { ThemeProvider } from '@/components/providers/theme-provider'

export const metadata: Metadata = {
  title: 'CRM & Project Management SaaS Platform',
  description:
    'Multi-tenant SaaS platform combining CRM, Project Management, and Unified Communication Hub',
}

const antiFlashScript = `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light')}}catch(e){}})()`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased min-h-screen transition-colors duration-150">
        <ThemeProvider>
          <SupportBannerWrapper />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
