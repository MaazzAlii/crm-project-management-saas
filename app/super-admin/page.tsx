import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function SuperAdminRootPage() {
  redirect('/super-admin/dashboard')
}
