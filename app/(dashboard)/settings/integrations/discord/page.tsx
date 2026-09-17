import { getDiscordIntegrationStatusAction } from './actions'
import DiscordClientPage from './DiscordClientPage'

export const metadata = {
  title: 'Discord Integration Settings | CRM Platform'
}

export default async function DiscordIntegrationPage() {
  const { channel } = await getDiscordIntegrationStatusAction()
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return <DiscordClientPage initialChannel={channel} appBaseUrl={appBaseUrl} />
}
