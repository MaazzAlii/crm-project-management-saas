'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  ExternalLink,
  X,
  MessageSquare
} from 'lucide-react'
import {
  InAppNotificationRecord,
  fetchInAppNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction
} from '@/app/(dashboard)/notifications/actions'

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<InAppNotificationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const data = await fetchInAppNotificationsAction()
      setNotifications(data)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    )
    await markNotificationAsReadAction(id)
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
    )
    await markAllNotificationsAsReadAction()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'deadline_approaching':
        return <Clock className="w-4 h-4 text-amber-500" />
      case 'milestone_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      default:
        return <MessageSquare className="w-4 h-4 text-sky-500" />
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="In-App Notifications"
        className="relative rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-slate-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.read_at

                return (
                  <div
                    key={n.id}
                    className={`p-3.5 flex items-start gap-3 transition ${
                      isUnread ? 'bg-indigo-950/20' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getNotificationIcon(n.type)}</div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">
                          {n.title}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        )}
                      </div>

                      {n.body && (
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {n.body}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                        <span>
                          {new Date(n.created_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>

                        {/* Direct link */}
                        {n.related_entity_type === 'project' && n.related_entity_id && (
                          <Link
                            href={`/projects/${n.related_entity_id}`}
                            onClick={() => setIsOpen(false)}
                            className="text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            View Project <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                        {n.related_entity_type === 'task' && (
                          <Link
                            href="/tasks"
                            onClick={() => setIsOpen(false)}
                            className="text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            View Tasks <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
