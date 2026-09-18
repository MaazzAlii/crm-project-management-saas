'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { getProviderMeta } from './providerBranding'
import { ConnectionStatusModal, ChannelStatusInfo } from './ConnectionStatusModal'

interface ChannelStatusBadgeProps {
  provider: string
  channelName?: string | null
  status?: string | 'active' | 'disconnected' | 'error'
  showStatusDot?: boolean
  showConnectionText?: boolean
  unreadCount?: number
  onClick?: () => void
  allowModal?: boolean
  channelInfo?: ChannelStatusInfo
  size?: 'sm' | 'md' | 'lg'
}

export function ChannelStatusBadge({
  provider,
  channelName,
  status = 'active',
  showStatusDot = true,
  showConnectionText = false,
  unreadCount,
  onClick,
  allowModal = true,
  channelInfo,
  size = 'md'
}: ChannelStatusBadgeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const meta = getProviderMeta(provider)
  const Icon = meta.icon
  const isConnected = status === 'active'

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick()
    } else if (allowModal) {
      e.stopPropagation()
      setIsModalOpen(true)
    }
  }

  const modalChannel: ChannelStatusInfo = channelInfo || {
    provider,
    channel_name: channelName || meta.name,
    status: status as any
  }

  // Size variations
  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 gap-1',
    md: 'text-[10px] px-2 py-0.5 gap-1.5',
    lg: 'text-xs px-2.5 py-1 gap-2'
  }[size]

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  }[size]

  return (
    <>
      <span
        onClick={handleClick}
        className={`inline-flex items-center font-bold rounded-full border transition-all select-none ${sizeClasses} ${
          allowModal || onClick ? 'cursor-pointer hover:opacity-85' : ''
        }`}
        style={meta.badgeStyle}
        title={`${meta.name} Channel (${isConnected ? 'Connected' : 'Disconnected'}) - Click to view status`}
      >
        <Icon className={iconSizes} style={{ color: meta.color }} />
        <span>{meta.name}</span>

        {showStatusDot && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-amber-500'
            }`}
          />
        )}

        {showConnectionText && (
          <span className="font-medium text-[9px] opacity-90">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        )}

        {typeof unreadCount === 'number' && unreadCount > 0 && (
          <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] font-extrabold bg-red-500 text-white leading-none">
            {unreadCount}
          </span>
        )}
      </span>

      {allowModal && (
        <ConnectionStatusModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          channel={modalChannel}
        />
      )}
    </>
  )
}
