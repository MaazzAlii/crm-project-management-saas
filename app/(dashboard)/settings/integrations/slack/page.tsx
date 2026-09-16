import { getSlackIntegrationStatusAction } from './actions'
import SlackClientPage from './SlackClientPage'

export const metadata = {
  title: 'Slack Integration Settings | CRM Platform'
}

export default async function SlackIntegrationPage() {
  const { channel } = await getSlackIntegrationStatusAction()
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return <SlackClientPage initialChannel={channel} appBaseUrl={appBaseUrl} />
}
