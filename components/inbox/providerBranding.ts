import {
  MessageSquare,
  MessageCircle,
  Mail,
  Gamepad2,
  Briefcase,
  LucideIcon
} from 'lucide-react'

export interface ProviderMeta {
  id: 'slack' | 'whatsapp' | 'email' | 'discord' | 'upwork'
  name: string
  color: string // Hex code per specification
  bgColor: string // Light tinted background
  borderColor: string // Border with color
  textColor: string // Text color
  badgeStyle: {
    backgroundColor: string
    borderColor: string
    color: string
  }
  activeTabStyle: {
    backgroundColor: string
    color: string
    borderColor: string
  }
  icon: LucideIcon
  webhookPath: string
  settingsPath: string
  description: string
}

export const PROVIDER_BRANDING: Record<string, ProviderMeta> = {
  slack: {
    id: 'slack',
    name: 'Slack',
    color: '#36C5F0', // Slack blue
    bgColor: 'rgba(54, 197, 240, 0.12)',
    borderColor: 'rgba(54, 197, 240, 0.35)',
    textColor: '#36C5F0',
    badgeStyle: {
      backgroundColor: 'rgba(54, 197, 240, 0.12)',
      borderColor: 'rgba(54, 197, 240, 0.35)',
      color: '#36C5F0'
    },
    activeTabStyle: {
      backgroundColor: '#36C5F0',
      color: '#ffffff',
      borderColor: '#36C5F0'
    },
    icon: MessageSquare,
    webhookPath: '/api/webhooks/slack',
    settingsPath: '/settings/integrations/slack',
    description: 'Slack Workspace channel and direct messages'
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366', // WhatsApp green
    bgColor: 'rgba(37, 211, 102, 0.12)',
    borderColor: 'rgba(37, 211, 102, 0.35)',
    textColor: '#25D366',
    badgeStyle: {
      backgroundColor: 'rgba(37, 211, 102, 0.12)',
      borderColor: 'rgba(37, 211, 102, 0.35)',
      color: '#25D366'
    },
    activeTabStyle: {
      backgroundColor: '#25D366',
      color: '#ffffff',
      borderColor: '#25D366'
    },
    icon: MessageCircle,
    webhookPath: '/api/webhooks/whatsapp',
    settingsPath: '/settings/integrations/whatsapp',
    description: 'WhatsApp Business API messaging webhooks'
  },
  email: {
    id: 'email',
    name: 'Email',
    color: '#EA4335', // Email red
    bgColor: 'rgba(234, 67, 53, 0.12)',
    borderColor: 'rgba(234, 67, 53, 0.35)',
    textColor: '#EA4335',
    badgeStyle: {
      backgroundColor: 'rgba(234, 67, 53, 0.12)',
      borderColor: 'rgba(234, 67, 53, 0.35)',
      color: '#EA4335'
    },
    activeTabStyle: {
      backgroundColor: '#EA4335',
      color: '#ffffff',
      borderColor: '#EA4335'
    },
    icon: Mail,
    webhookPath: '/api/webhooks/email',
    settingsPath: '/settings/integrations/email',
    description: 'Email threads, IMAP/SMTP sync & SendGrid inbound parse'
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    color: '#5865F2', // Discord indigo
    bgColor: 'rgba(88, 101, 242, 0.12)',
    borderColor: 'rgba(88, 101, 242, 0.35)',
    textColor: '#5865F2',
    badgeStyle: {
      backgroundColor: 'rgba(88, 101, 242, 0.12)',
      borderColor: 'rgba(88, 101, 242, 0.35)',
      color: '#5865F2'
    },
    activeTabStyle: {
      backgroundColor: '#5865F2',
      color: '#ffffff',
      borderColor: '#5865F2'
    },
    icon: Gamepad2,
    webhookPath: '/api/webhooks/discord',
    settingsPath: '/settings/integrations/discord',
    description: 'Discord Bot & server channel ingestion'
  },
  upwork: {
    id: 'upwork',
    name: 'Upwork',
    color: '#14A800', // Upwork dark green
    bgColor: 'rgba(20, 168, 0, 0.12)',
    borderColor: 'rgba(20, 168, 0, 0.35)',
    textColor: '#14A800',
    badgeStyle: {
      backgroundColor: 'rgba(20, 168, 0, 0.12)',
      borderColor: 'rgba(20, 168, 0, 0.35)',
      color: '#14A800'
    },
    activeTabStyle: {
      backgroundColor: '#14A800',
      color: '#ffffff',
      borderColor: '#14A800'
    },
    icon: Briefcase,
    webhookPath: '/api/webhooks/upwork',
    settingsPath: '/settings/integrations/upwork',
    description: 'Upwork proposals and contract direct messages'
  }
}

export function getProviderMeta(providerName: string | undefined | null): ProviderMeta {
  const key = (providerName || 'email').toLowerCase().trim()
  if (PROVIDER_BRANDING[key]) {
    return PROVIDER_BRANDING[key]
  }
  // Fallback
  return {
    id: 'email',
    name: providerName ? providerName.charAt(0).toUpperCase() + providerName.slice(1) : 'Channel',
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
    textColor: '#6366F1',
    badgeStyle: {
      backgroundColor: 'rgba(99, 102, 241, 0.12)',
      borderColor: 'rgba(99, 102, 241, 0.35)',
      color: '#6366F1'
    },
    activeTabStyle: {
      backgroundColor: '#6366F1',
      color: '#ffffff',
      borderColor: '#6366F1'
    },
    icon: MessageSquare,
    webhookPath: `/api/webhooks/${key}`,
    settingsPath: `/settings/integrations/${key}`,
    description: 'External communication channel'
  }
}
