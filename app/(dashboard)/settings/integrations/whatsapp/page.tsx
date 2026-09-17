import { getWhatsAppIntegrationStatusAction } from './actions'
import WhatsAppClientPage from './WhatsAppClientPage'

export const metadata = {
  title: 'WhatsApp Integration Settings | CRM Platform'
}

export default async function WhatsAppIntegrationPage() {
  const { channel } = await getWhatsAppIntegrationStatusAction()
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return <WhatsAppClientPage initialChannel={channel} appBaseUrl={appBaseUrl} />
}
