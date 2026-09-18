'use client'

import { useState } from 'react'
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Send,
  Edit3,
  Copy,
  Check,
  X,
  AlertCircle,
  FileText
} from 'lucide-react'
import { InboxMessageRecord } from '@/lib/inbox/query'
import { generateReplySuggestionsAction } from '@/app/(dashboard)/inbox/actions'
import { ReplySuggestionItem } from '@/lib/ai/features/reply-suggestions'

interface AISuggestButtonProps {
  channelId: string
  channelProvider?: string
  clientId?: string | null
  clientName?: string
  clientCompany?: string
  communicationMode?: 'manual' | 'connected'
  threadMessages?: InboxMessageRecord[]
  aiEnabled?: boolean
  onSelectSuggestion: (text: string) => void
  onDirectSend?: (text: string) => Promise<void> | void
  isSending?: boolean
}

export function AISuggestButton({
  channelId,
  channelProvider = 'email',
  clientId,
  clientName,
  clientCompany,
  communicationMode = 'connected',
  threadMessages = [],
  aiEnabled = true,
  onSelectSuggestion,
  onDirectSend,
  isSending = false,
}: AISuggestButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<ReplySuggestionItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [sendingIndex, setSendingIndex] = useState<number | null>(null)

  // Acceptance criteria: Confirm an AI-disabled org sees no suggestion button at all
  if (!aiEnabled) {
    return null
  }

  const handleFetchSuggestions = async () => {
    setIsLoading(true)
    setError(null)
    setIsOpen(true)

    try {
      // Prepare message history formatted for AI
      const formattedMessages = threadMessages.slice(-6).map((m) => ({
        sender_name: m.sender_name,
        sender_identifier: m.sender_identifier,
        body: m.body,
        direction: m.direction,
        sent_at: m.sent_at,
      }))

      const res = await generateReplySuggestionsAction({
        channelId,
        channelProvider,
        clientId,
        clientName,
        clientCompany,
        communicationMode,
        messages: formattedMessages,
      })

      if (res.success && res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions)
      } else {
        setError(res.error || 'Unable to generate reply suggestions.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while generating suggestions.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleDirectSendClick = async (text: string, index: number) => {
    if (!onDirectSend || isSending) return
    setSendingIndex(index)
    try {
      await onDirectSend(text)
      setIsOpen(false)
    } finally {
      setSendingIndex(null)
    }
  }

  const getToneBadgeStyle = (tone: string) => {
    const t = tone.toLowerCase()
    if (t.includes('pro')) {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    }
    if (t.includes('collab') || t.includes('warm') || t.includes('friend')) {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    }
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  }

  const isManual = communicationMode === 'manual'

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false)
          } else {
            handleFetchSuggestions()
          }
        }}
        disabled={isLoading}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition shadow-2xs ${
          isOpen
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-blue-500/10 hover:from-violet-500/20 hover:to-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
        }`}
        title="Generate AI-powered reply suggestions based on thread history"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Thinking...</span>
          </>
        ) : (
          <>
            <Sparkles className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : 'text-indigo-500'}`} />
            <span>Suggest Reply</span>
          </>
        )}
      </button>

      {/* AI Suggestions Tray */}
      {isOpen && (
        <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-indigo-500/20 dark:border-indigo-500/30 space-y-3 animate-in fade-in duration-200">
          {/* Tray Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                AI Reply Suggestions
              </span>

              {isManual ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  <FileText className="w-2.5 h-2.5" />
                  Manual Mode — Draft Review
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Connected — Direct Send
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleFetchSuggestions}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition px-2 py-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                title="Regenerate reply options"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition"
                title="Close suggestions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-2 py-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Analyzing recent messages and formulating 3 response options...</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-28 bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3 animate-pulse flex flex-col justify-between"
                  >
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-xs" />
                      <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-700 rounded-xs" />
                    </div>
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {!isLoading && error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between text-xs text-red-600 dark:text-red-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleFetchSuggestions}
                className="font-bold underline ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Suggestions List */}
          {!isLoading && !error && suggestions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {suggestions.map((suggestion, idx) => {
                const isCopied = copiedIndex === idx
                const isCardSending = sendingIndex === idx

                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-xl p-3 flex flex-col justify-between shadow-2xs transition group"
                  >
                    <div>
                      {/* Tone Header & Copy Button */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getToneBadgeStyle(
                            suggestion.tone
                          )}`}
                        >
                          {suggestion.tone}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopy(suggestion.text, idx)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5"
                          title="Copy to clipboard"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Suggestion Text */}
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-4">
                        {suggestion.text}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSuggestion(suggestion.text)
                          setIsOpen(false)
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Draft</span>
                      </button>

                      {!isManual && onDirectSend ? (
                        <button
                          type="button"
                          onClick={() => handleDirectSendClick(suggestion.text, idx)}
                          disabled={isCardSending || isSending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold transition shadow-xs"
                          title={`Send directly via ${channelProvider}`}
                        >
                          {isCardSending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>Send</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Manual draft
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer Informational Note */}
          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between pt-1">
            <span>
              {isManual
                ? 'Manual Mode: Replies are drafted for review. Use "Edit Draft" to modify or copy to external app.'
                : 'Connected Mode: Send directly across the channel or select "Edit Draft" to customize before dispatch.'}
            </span>
            <span>Always human-reviewed</span>
          </div>
        </div>
      )}
    </>
  )
}
