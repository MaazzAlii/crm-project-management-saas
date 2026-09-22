export interface TagRecord {
  id: string
  organization_id: string
  name: string
  color: string
  created_at: string
}

export const TAG_COLORS = [
  { value: 'sky', label: 'Sky Blue', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  { value: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { value: 'amber', label: 'Amber Gold', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { value: 'rose', label: 'Rose Red', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { value: 'slate', label: 'Slate Gray', bg: 'bg-slate-800 text-slate-300 border-slate-700' },
] as const
