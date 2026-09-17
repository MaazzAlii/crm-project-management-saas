import { getUpworkIntegrationStatusAction } from './actions'
import UpworkClientPage from './UpworkClientPage'

export const metadata = {
  title: 'Upwork Integration Settings | CRM Platform'
}

export default async function UpworkIntegrationPage() {
  const { channel } = await getUpworkIntegrationStatusAction()
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return <UpworkClientPage initialChannel={channel} appBaseUrl={appBaseUrl} />
}
