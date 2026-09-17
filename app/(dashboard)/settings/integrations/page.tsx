import Link from 'next/link'
import {
  MessageSquare,
  MessageCircle,
  Mail,
  Gamepad2,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  Puzzle,
  Sparkles
} from 'lucide-react'
import { getSlackIntegrationStatusAction } from './slack/actions'
import { getWhatsAppIntegrationStatusAction } from './whatsapp/actions'
import { getEmailIntegrationStatusAction } from './email/actions'

export const metadata = {
  title: 'Channel Integrations | CRM Platform'
}

export default async function IntegrationsSettingsPage() {
  const { channel: slackChannel } = await getSlackIntegrationStatusAction()
  const { channel: waChannel } = await getWhatsAppIntegrationStatusAction()
  const { channel: emailChannel } = await getEmailIntegrationStatusAction()
  const isSlackConnected = slackChannel?.status === 'active'
  const isWhatsAppConnected = waChannel?.status === 'active'
  const isEmailConnected = emailChannel?.status === 'active'

  const integrations = [
    {
      id: 'slack',
      name: 'Slack Workspace',
      description: 'Connect Slack channels for two-way client conversations and unified inbox routing.',
      icon: MessageSquare,
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      status: isSlackConnected ? 'Connected' : 'Configure',
      isConnected: isSlackConnected,
      href: '/settings/integrations/slack',
      active: true
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Receive and reply to WhatsApp Business messaging API webhooks.',
      icon: MessageCircle,
      iconBg: 'bg-green-500/10 text-green-400 border-green-500/20',
      status: isWhatsAppConnected ? 'Connected' : 'Configure',
      isConnected: isWhatsAppConnected,
      href: '/settings/integrations/whatsapp',
      active: true
    },
    {
      id: 'email',
      name: 'Email (Inbound & Outbound)',
      description: 'Connect IMAP/SMTP or SendGrid webhooks for email thread sync.',
      icon: Mail,
      iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      status: isEmailConnected ? 'Connected' : 'Configure',
      isConnected: isEmailConnected,
      href: '/settings/integrations/email',
      active: true
    },
    {
      id: 'discord',
      name: 'Discord Communities',
      description: 'Ingest Discord server messages & DM channels into unified inbox.',
      icon: Gamepad2,
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      status: 'Task 40',
      isConnected: false,
      href: '#',
      active: false
    },
    {
      id: 'upwork',
      name: 'Upwork Direct Messages',
      description: 'Sync contract proposals and buyer messages from Upwork.',
      icon: Briefcase,
      iconBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      status: 'Task 40',
      isConnected: false,
      href: '#',
      active: false
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
            Manage connected external communication channels. Inbound webhooks normalizes messages into your Unified Inbox, matching client accounts automatically.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-700 shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-sky-400" />
          Hub Adapters Active
        </div>
      </div>

      {/* Grid of Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className={`rounded-2xl border bg-slate-900/80 p-6 flex flex-col justify-between transition-all ${
                item.active
                  ? 'border-slate-800 hover:border-slate-700 shadow-lg hover:shadow-sky-500/5'
                  : 'border-slate-800/60 opacity-70'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`h-11 w-11 rounded-xl border flex items-center justify-center ${item.iconBg}`}>
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  {item.isConnected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-semibold">
                      {item.status}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {item.active ? 'Webhook Adapter Ready' : 'Planned Adapter'}
                </span>

                {item.active ? (
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Manage Settings <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-slate-600">Coming Soon</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
