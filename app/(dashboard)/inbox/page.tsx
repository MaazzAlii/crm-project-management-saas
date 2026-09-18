import { Metadata } from 'next'
import { fetchInboxDataAction } from './actions'
import { InboxView } from '@/components/inbox/InboxView'

export const metadata: Metadata = {
  title: 'Unified Inbox | Communication Hub | CRM SaaS',
  description: 'Unified multi-channel communication hub for agency clients across Slack, WhatsApp, Email, Discord, and Upwork.'
}

export default async function InboxPage() {
  const data = await fetchInboxDataAction()

  return (
    <InboxView
      initialMessages={data.messages}
      initialSummary={data.summary}
      clients={data.clients}
      channels={data.channels}
      aiEnabled={data.aiEnabled}
    />
  )
}
