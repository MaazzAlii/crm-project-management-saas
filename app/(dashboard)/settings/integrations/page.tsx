import { Metadata } from 'next'
import { Puzzle, Sparkles } from 'lucide-react'
import { getSlackIntegrationStatusAction } from './slack/actions'
import { getWhatsAppIntegrationStatusAction } from './whatsapp/actions'
import { getEmailIntegrationStatusAction } from './email/actions'
import { getDiscordIntegrationStatusAction } from './discord/actions'
import { getUpworkIntegrationStatusAction } from './upwork/actions'
import { IntegrationsList, IntegrationCardItem } from '@/components/settings/IntegrationsList'

export const metadata: Metadata = {
  title: 'Channel Integrations & Status | CRM Platform'
}

export default async function IntegrationsSettingsPage() {
  const { channel: slackChannel } = await getSlackIntegrationStatusAction()
  const { channel: waChannel } = await getWhatsAppIntegrationStatusAction()
  const { channel: emailChannel } = await getEmailIntegrationStatusAction()
  const { channel: discordChannel } = await getDiscordIntegrationStatusAction()
  const { channel: upworkChannel } = await getUpworkIntegrationStatusAction()

  const isSlackConnected = slackChannel?.status === 'active'
  const isWhatsAppConnected = waChannel?.status === 'active'
  const isEmailConnected = emailChannel?.status === 'active'
  const isDiscordConnected = discordChannel?.status === 'active'
  const isUpworkConnected = upworkChannel?.status === 'active'

  const integrations: IntegrationCardItem[] = [
    {
      id: 'slack',
      name: 'Slack Workspace',
      description: 'Connect Slack channels for two-way client conversations and unified inbox routing.',
      isConnected: isSlackConnected,
      channel: slackChannel,
      href: '/settings/integrations/slack'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Receive and reply to WhatsApp Business messaging API webhooks.',
      isConnected: isWhatsAppConnected,
      channel: waChannel,
      href: '/settings/integrations/whatsapp'
    },
    {
      id: 'email',
      name: 'Email (Inbound & Outbound)',
      description: 'Connect IMAP/SMTP or SendGrid webhooks for email thread sync.',
      isConnected: isEmailConnected,
      channel: emailChannel,
      href: '/settings/integrations/email'
    },
    {
      id: 'discord',
      name: 'Discord Communities',
      description: 'Ingest Discord server messages & DM channels into unified inbox.',
      isConnected: isDiscordConnected,
      channel: discordChannel,
      href: '/settings/integrations/discord'
    },
    {
      id: 'upwork',
      name: 'Upwork Direct Messages',
      description: 'Sync contract proposals and buyer messages from Upwork.',
      isConnected: isUpworkConnected,
      channel: upworkChannel,
      href: '/settings/integrations/upwork'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Overview Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl flex items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Puzzle className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-extrabold text-white">Channel Integrations &amp; Webhooks</h1>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            Manage external communication channels. Inbound webhooks normalize messages into your Unified Inbox, matching client accounts automatically. Click any channel status to inspect last sync times, webhook endpoints, and credential validation.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-700 shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-sky-400" />
          Hub Status Active
        </div>
      </div>

      {/* Grid of Interactive Integration Cards */}
      <IntegrationsList integrations={integrations} />
    </div>
  )
}
