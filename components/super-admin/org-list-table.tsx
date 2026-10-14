'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import { OrgListFilter } from './org-list-filter'
import { SuspendOrgModal, OverridePlanModal } from './org-management-actions'

export interface OrgListItem {
  id: string
  name: string
  slug: string
  plan_tier: string
  billing_status: string
  is_suspended?: boolean
  created_at: string
  memberCount: number
}

interface OrgListTableProps {
  organizations: OrgListItem[]
}

export function OrgListTable({ organizations }: OrgListTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPlan =
      selectedPlan === 'all' || org.plan_tier.toLowerCase() === selectedPlan.toLowerCase()

    let matchesStatus = true
    if (selectedStatus === 'suspended') {
      matchesStatus = !!org.is_suspended
    } else if (selectedStatus !== 'all') {
      matchesStatus = org.billing_status.toLowerCase() === selectedStatus.toLowerCase()
    }

    return matchesSearch && matchesPlan && matchesStatus
  })

  const getBadgeStyle = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30'
      case 'pro':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30'
      case 'starter':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="space-y-4">
      <OrgListFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredOrgs.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No organizations match the selected filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Organization</th>
                  <th className="py-3.5 px-4 font-semibold">Plan Tier</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Team Members</th>
                  <th className="py-3.5 px-4 font-semibold">Created</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/super-admin/organizations/${org.id}`}
                        className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <Building2 className="h-4 w-4 text-primary" />
                        {org.name}
                      </Link>
                      <div className="text-[11px] text-subtle-foreground font-mono ml-5">
                        /{org.slug}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold border ${getBadgeStyle(org.plan_tier)}`}>
                        {org.plan_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {org.is_suspended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="h-3 w-3" />
                          Suspended
                        </span>
                      ) : org.billing_status === 'active' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-300 border border-amber-500/30 capitalize">
                          {org.billing_status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-foreground">
                      {org.memberCount} members
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <OverridePlanModal
                          orgId={org.id}
                          orgName={org.name}
                          currentPlanTier={org.plan_tier}
                        />
                        <SuspendOrgModal
                          orgId={org.id}
                          orgName={org.name}
                          isSuspended={!!org.is_suspended}
                        />
                        <Link
                          href={`/super-admin/organizations/${org.id}`}
                          className="flex items-center gap-0.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        >
                          Details
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
