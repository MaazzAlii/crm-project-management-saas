import { getImpersonationContext } from '@/lib/auth/impersonation'
import { ImpersonationBanner } from './impersonation-banner'

export async function SupportBannerWrapper() {
  const ctx = await getImpersonationContext()

  return (
    <ImpersonationBanner
      initialActive={ctx.active}
      orgName={ctx.orgName}
      userName={ctx.userName}
      userEmail={ctx.userEmail}
      expiresAt={ctx.expiresAt}
    />
  )
}
