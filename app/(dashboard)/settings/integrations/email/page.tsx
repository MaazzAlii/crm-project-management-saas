import { getEmailIntegrationStatusAction } from './actions'
import EmailClientPage from './EmailClientPage'

export const metadata = {
  title: 'Email Integration Settings | CRM Platform'
}

export default async function EmailIntegrationPage() {
  const { channel } = await getEmailIntegrationStatusAction()
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return <EmailClientPage initialChannel={channel} appBaseUrl={appBaseUrl} />
}
