'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClientFilters, ClientFiltersState } from './ClientFilters'
import { CommunicationModeBadge } from './CommunicationModeBadge'
import { EmptyState } from './EmptyState'
import { deleteClientAction } from '@/app/(dashboard)/clients/actions'
import {
  LayoutGrid,
  List as ListIcon,
  Plus,
  Trash2,
  Building2,
  Mail,
  Phone,
  Globe,
  Calendar,
  MoreVertical,
  Loader2,
  ExternalLink,
} from 'lucide-react'

import { TagBadge } from './TagBadge'
import { TagManagerModal } from './TagManagerModal'
import { Tag as TagIcon } from 'lucide-react'

export interface ClientRecord {
  id: string
  organization_id: string
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  platform?: string | null
  country?: string | null
  currency?: string | null
  payment_schedule?: string | null
  status: string
  communication_mode: 'manual' | 'connected' | string
  notes?: string | null
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface ClientsListProps {
  initialClients: ClientRecord[]
  userRole?: string | null
  isSuperAdmin?: boolean
}

export function ClientsList({ initialClients, userRole, isSuperAdmin }: ClientsListProps) {
  const router = useRouter()

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false)

  const [filters, setFilters] = useState<ClientFiltersState>({
    search: '',
    status: '',
    platform: '',
    country: '',
    communicationMode: '',
    tag: '',
  })

  // Extract unique countries & tags for filter dropdowns
  const countriesList = useMemo(() => {
    const set = new Set<string>()
    initialClients.forEach((c) => {
      if (c.country) set.add(c.country)
    })
    return Array.from(set).sort()
  }, [initialClients])

  const tagsList = useMemo(() => {
    const set = new Set<string>()
    initialClients.forEach((c) => {
      if (c.tags && Array.isArray(c.tags)) {
        c.tags.forEach((t) => set.add(t))
      }
    })
    return Array.from(set).sort()
  }, [initialClients])

  // Filter clients client-side
  const filteredClients = useMemo(() => {
    return initialClients.filter((client) => {
      // Search filter
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase()
        const matchesName = client.name.toLowerCase().includes(query)
        const matchesCompany = client.company?.toLowerCase().includes(query) ?? false
        const matchesEmail = client.email?.toLowerCase().includes(query) ?? false
        if (!matchesName && !matchesCompany && !matchesEmail) return false
      }

      // Status filter
      if (filters.status && client.status !== filters.status) {
        return false
      }

      // Platform filter
      if (filters.platform && client.platform !== filters.platform) {
        return false
      }

      // Country filter
      if (filters.country && client.country !== filters.country) {
        return false
      }

      // Communication Mode filter
      if (filters.communicationMode && client.communication_mode !== filters.communicationMode) {
        return false
      }

      // Tag filter
      if (filters.tag && (!client.tags || !client.tags.includes(filters.tag))) {
        return false
      }

      return true
    })
  }, [initialClients, filters])

  const canManage = userRole === 'owner' || userRole === 'admin' || isSuperAdmin

  const handleDelete = async (clientId: string, clientName: string) => {
    if (!canManage) return
    if (!confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(clientId)
    try {
      const res = await deleteClientAction(clientId)
      if (res?.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete client.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      platform: '',
      country: '',
      communicationMode: '',
      tag: '',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            Active
          </span>
        )
      case 'paused':
        return (
          <span className="inline-flex items-center rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            Paused
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center rounded-md bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
            Completed
          </span>
        )
      case 'archived':
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-muted border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            Archived
          </span>
        )
    }
  }

  const isFiltered =
    !!filters.search ||
    !!filters.status ||
    !!filters.platform ||
    !!filters.country ||
    !!filters.communicationMode

  return (
    <div className="space-y-5">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Clients Directory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your agency clients, communication mode, and platform integrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-border bg-card/80 p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <ListIcon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'cards'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Cards</span>
            </button>
          </div>

          {/* Manage Tags Button */}
          <button
            onClick={() => setIsTagManagerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <TagIcon className="h-3.5 w-3.5 text-primary" />
            <span>Manage Tags</span>
          </button>

          {/* Add Client Button */}
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New Client</span>
          </Link>
        </div>
      </div>

      {/* Filter Component */}
      <ClientFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        totalCount={initialClients.length}
        filteredCount={filteredClients.length}
        countriesList={countriesList}
        tagsList={tagsList}
      />

      {/* Empty State checks */}
      {filteredClients.length === 0 ? (
        <EmptyState isFiltered={isFiltered} onClearFilters={handleResetFilters} />
      ) : (
        <>
          {/* View Mode 1: Zebra Striped Responsive Table */}
          {viewMode === 'table' ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow-xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-foreground">
                  <thead className="border-b border-border bg-muted/60 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Client & Company</th>
                      <th className="px-4 py-3.5">Tags</th>
                      <th className="px-4 py-3.5">Contact Email</th>
                      <th className="px-4 py-3.5">Platform</th>
                      <th className="px-4 py-3.5">Country</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Comm. Mode</th>
                      <th className="px-4 py-3.5">Created</th>
                      {canManage && <th className="px-4 py-3.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClients.map((client, idx) => (
                      <tr
                        key={client.id}
                        className={`transition hover:bg-muted/50 ${
                          idx % 2 === 0 ? 'bg-card/30' : 'bg-muted/20'
                        }`}
                      >
                        {/* Name & Company */}
                        <td className="px-5 py-4 font-medium">
                          <div className="flex flex-col">
                            <Link
                              href={`/clients/${client.id}`}
                              className="font-bold text-foreground text-sm hover:text-primary transition flex items-center gap-1.5"
                            >
                              <span>{client.name}</span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition" />
                            </Link>
                            {client.company && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                {client.company}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tags */}
                        <td className="px-4 py-4">
                          {client.tags && client.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {client.tags.map((t) => (
                                <TagBadge key={t} name={t} />
                              ))}
                            </div>
                          ) : (
                            <span className="text-subtle-foreground text-[11px]">—</span>
                          )}
                        </td>

                        {/* Email */}
                        <td className="px-4 py-4">
                          {client.email ? (
                            <span
                              className="text-foreground truncate max-w-[180px] inline-block"
                              title={client.email}
                            >
                              {client.email}
                            </span>
                          ) : (
                            <span className="text-subtle-foreground">—</span>
                          )}
                        </td>

                        {/* Platform */}
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground">
                            {client.platform || 'WhatsApp'}
                          </span>
                        </td>

                        {/* Country */}
                        <td className="px-4 py-4">
                          <span className="text-foreground">
                            {client.country || '—'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">{getStatusBadge(client.status)}</td>

                        {/* Communication Mode Badge */}
                        <td className="px-4 py-4">
                          <CommunicationModeBadge mode={client.communication_mode} />
                        </td>

                        {/* Created At */}
                        <td className="px-4 py-4 text-muted-foreground text-[11px]">
                          {new Date(client.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Actions */}
                        {canManage && (
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => handleDelete(client.id, client.name)}
                              disabled={deletingId === client.id}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                              title="Delete Client"
                            >
                              {deletingId === client.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* View Mode 2: Card Grid View */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card/60 p-5 shadow-xs backdrop-blur-md hover:border-border/80 transition space-y-4"
                >
                  {/* Top Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-extrabold text-foreground text-base leading-tight hover:text-primary transition"
                      >
                        {client.name}
                      </Link>
                      {client.company && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {client.company}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(client.status)}
                  </div>

                  {/* Badges & Mode Row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <CommunicationModeBadge mode={client.communication_mode} />
                    <span className="inline-flex items-center rounded-lg border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {client.platform || 'WhatsApp'}
                    </span>
                    {client.tags && client.tags.map((t) => (
                      <TagBadge key={t} name={t} />
                    ))}
                  </div>

                  {/* Contact Info List */}
                  <div className="space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                    {client.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.country && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{client.country}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(client.created_at).toLocaleDateString()}
                    </span>

                    {canManage && (
                      <button
                        onClick={() => handleDelete(client.id, client.name)}
                        disabled={deletingId === client.id}
                        className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition"
                      >
                        {deletingId === client.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tag Manager Modal */}
      <TagManagerModal
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        onTagsUpdated={() => router.refresh()}
      />
    </div>
  )
}
