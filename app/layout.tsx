import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRM & Project Management SaaS Platform',
  description: 'Multi-tenant SaaS platform combining CRM, Project Management, and Unified Communication Hub',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
