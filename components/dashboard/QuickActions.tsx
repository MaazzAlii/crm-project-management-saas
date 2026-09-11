import Link from 'next/link'
import { UserPlus, FolderPlus, CheckSquare, UserCheck } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      label: 'New Client',
      href: '/clients?action=new',
      icon: UserPlus,
      color: 'from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500',
    },
    {
      label: 'New Project',
      href: '/projects?action=new',
      icon: FolderPlus,
      color: 'from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500',
    },
    {
      label: 'Create Task',
      href: '/tasks?action=new',
      icon: CheckSquare,
      color: 'from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500',
    },
    {
      label: 'Invite Team',
      href: '/team?action=invite',
      icon: UserCheck,
      color: 'from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500',
    },
  ]

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${action.color} px-4 py-3 text-xs font-bold text-white shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0`}
            >
              <Icon className="h-4 w-4" />
              <span>{action.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
