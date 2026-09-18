'use client'

import { useState } from 'react'
import {
  Sparkles,
  X,
  Printer,
  Copy,
  Check,
  Send,
  Loader2,
  CheckSquare,
  Briefcase,
  Users,
  DollarSign,
  MessageSquare,
  AlertTriangle,
  FileText,
  Edit3,
  Eye,
  Building2,
  Calendar,
} from 'lucide-react'
import { WeeklyReportFigures } from '@/lib/ai/features/report-narrative'
import {
  generateWeeklyReportAction,
  sendWeeklyReportAction,
} from '@/app/(dashboard)/reports/actions'

interface WeeklyReportModalProps {
  isOpen: boolean
  onClose: () => void
  initialFigures: WeeklyReportFigures
  aiEnabled?: boolean
  initialNarrative?: string
}

export function WeeklyReportModal({
  isOpen,
  onClose,
  initialFigures,
  aiEnabled = true,
  initialNarrative = '',
}: WeeklyReportModalProps) {
  const [figures, setFigures] = useState<WeeklyReportFigures>(initialFigures)
  const [narrative, setNarrative] = useState<string>(initialNarrative)
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setSendSuccess(false)

    try {
      const res = await generateWeeklyReportAction(figures)
      if (res.success && res.narrative) {
        setNarrative(res.narrative)
        if (res.figures) {
          setFigures(res.figures)
        }
      } else {
        setError(res.error || 'Failed to generate weekly narrative.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!narrative) return
    navigator.clipboard.writeText(narrative)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Please enter a valid recipient email address.')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const res = await sendWeeklyReportAction({
        recipientEmails: [recipientEmail.trim()],
        narrative,
        subject: `Weekly Executive Progress Report — ${figures.organizationName}`,
      })

      if (res.success) {
        setSendSuccess(true)
        setShowEmailInput(false)
      } else {
        setError(res.error || 'Failed to send report.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send report.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:bg-white print:text-black">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/70 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Weekly Executive Report</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {figures.weekDateRange}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI-synthesized progress narrative and verified CRM performance metrics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Printable Report Header (visible only on print) */}
          <div className="hidden print:block border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Executive Weekly Progress Report</h1>
            <p className="text-sm text-slate-600">
              {figures.organizationName} • Reporting Window: {figures.weekDateRange}
            </p>
          </div>

          {/* 6 Key Performance Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 print:text-slate-600">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tasks Done</span>
              </div>
              <div className="text-xl font-extrabold text-white print:text-slate-900">
                {figures.completedTasksCount}
              </div>
              <div className="text-[10px] text-slate-500">Past 7 days</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 print:text-slate-600">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>Active Projects</span>
              </div>
              <div className="text-xl font-extrabold text-white print:text-slate-900">
                {figures.activeProjectsCount}
              </div>
              <div className="text-[10px] text-slate-500">In delivery</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 print:text-slate-600">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>New Clients</span>
              </div>
              <div className="text-xl font-extrabold text-white print:text-slate-900">
                {figures.newClientsCount}
              </div>
              <div className="text-[10px] text-slate-500">Acquired</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 print:text-slate-600">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Revenue</span>
              </div>
              <div className="text-xl font-extrabold text-white print:text-slate-900">
                ${figures.revenueGenerated.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">Invoiced / Active</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 print:text-slate-600">
                <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                <span>Messages</span>
              </div>
              <div className="text-xl font-extrabold text-white print:text-slate-900">
                {figures.communicationVolume}
              </div>
              <div className="text-[10px] text-slate-500">All channels</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 print:text-slate-600">
                <AlertTriangle className={`w-3.5 h-3.5 ${figures.overdueItemsCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>Overdue Flags</span>
              </div>
              <div className={`text-xl font-extrabold ${figures.overdueItemsCount > 0 ? 'text-amber-400' : 'text-slate-400'} print:text-slate-900`}>
                {figures.overdueItemsCount}
              </div>
              <div className="text-[10px] text-slate-500">Attention needed</div>
            </div>
          </div>

          {/* AI Narrative Section Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 print:hidden">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Narrative Summary</h4>
              {aiEnabled && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {narrative ? 'Regenerate Narrative' : 'Generate with AI'}
                    </>
                  )}
                </button>
              )}
            </div>

            {narrative && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                    activeTab === 'preview'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition ${
                    activeTab === 'edit'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Report
                </button>
              </div>
            )}
          </div>

          {/* Feedback & Status Messages */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          {sendSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Weekly report successfully sent to {recipientEmail || 'stakeholders'}.
            </div>
          )}

          {/* Narrative Content Area */}
          {!narrative && !isGenerating && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-10 text-center space-y-3 print:hidden">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-sm">Ready to Generate Weekly Narrative</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click <span className="font-semibold text-slate-200">&ldquo;Generate with AI&rdquo;</span> to synthesize the past 7 days of operational data into a polished executive progress report.
              </p>
              {aiEnabled && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Weekly Narrative
                </button>
              )}
            </div>
          )}

          {isGenerating && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-10 text-center space-y-3 print:hidden">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <h4 className="font-bold text-white text-sm">Synthesizing Operational Data...</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Cross-referencing {figures.completedTasksCount} completed tasks, {figures.activeProjectsCount} active projects, and communication history to craft your executive summary.
              </p>
            </div>
          )}

          {narrative && !isGenerating && (
            <>
              {activeTab === 'edit' ? (
                <div className="space-y-1.5 print:hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Markdown Editable Content</span>
                    <span>{narrative.length} characters</span>
                  </div>
                  <textarea
                    rows={14}
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                    placeholder="Weekly narrative report content in markdown..."
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-4 print:border-none print:p-0 print:bg-transparent">
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed print:text-slate-800 space-y-3 whitespace-pre-wrap font-sans">
                    {narrative}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email Stakeholders Expandable Form */}
          {showEmailInput && (
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3 print:hidden">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Dispatch Report via Email</span>
                <button
                  type="button"
                  onClick={() => setShowEmailInput(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="stakeholder@client.com or investor@agency.com"
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSending || !recipientEmail}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Email
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>{figures.organizationName}</span>
            <span>•</span>
            <Calendar className="w-3.5 h-3.5" />
            <span>{figures.weekDateRange}</span>
          </div>

          <div className="flex items-center gap-2">
            {narrative && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  title="Copy formatted narrative to clipboard"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmailInput(!showEmailInput)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
