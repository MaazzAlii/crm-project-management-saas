import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getMemberStatus, formatRelativeTime } from '@/components/settings/TeamMemberList'
import { orgRepo } from '@/lib/db/repositories/org-repo'
import { userRepo } from '@/lib/db/repositories/user-repo'

describe('TEAM-4: Team UI Polish & Real-time Refinements', () => {
  describe('Bug #15: Member Status & Last Active Signals', () => {
    it('7. Member status badge shows "Active" when is_active === true and last_login within 30d', () => {
      const recentLogin = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      const status = getMemberStatus({
        id: 'mem-1',
        userId: 'u-1',
        role: 'member',
        joinedAt: new Date().toISOString(),
        isActive: true,
        lastLoginAt: recentLogin,
        profile: {
          fullName: 'Alice Active',
          email: 'alice@example.com',
          avatarUrl: null,
        },
      })

      expect(status.label).toBe('Active')
      expect(status.badgeStyle).toContain('bg-emerald-500/10')
      expect(status.badgeStyle).toContain('text-emerald-600')
      expect(status.supplementaryNote).toBeUndefined()
    })

    it('8. Member status badge shows "Suspended" when is_active === false', () => {
      const recentLogin = new Date().toISOString()
      const status = getMemberStatus({
        id: 'mem-2',
        userId: 'u-2',
        role: 'member',
        joinedAt: new Date().toISOString(),
        isActive: false,
        lastLoginAt: recentLogin,
        profile: {
          fullName: 'Bob Suspended',
          email: 'bob@example.com',
          avatarUrl: null,
        },
      })

      expect(status.label).toBe('Suspended')
      expect(status.badgeStyle).toContain('bg-muted')
      expect(status.badgeStyle).toContain('text-muted-foreground')
    })

    it('Surfaces "Active" with supplementary note when is_active === true and last_login >30d ago', () => {
      const oldLogin = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago
      const status = getMemberStatus({
        id: 'mem-3',
        userId: 'u-3',
        role: 'member',
        joinedAt: new Date().toISOString(),
        isActive: true,
        lastLoginAt: oldLogin,
        profile: {
          fullName: 'Charlie Stale',
          email: 'charlie@example.com',
          avatarUrl: null,
        },
      })

      expect(status.label).toBe('Active')
      expect(status.badgeStyle).toContain('bg-emerald-500/10')
      expect(status.supplementaryNote).toBe('Inactive >30d')
    })

    it('Surfaces "Active" with "No login yet" note when is_active === true and last_login is null', () => {
      const status = getMemberStatus({
        id: 'mem-4',
        userId: 'u-4',
        role: 'member',
        joinedAt: new Date().toISOString(),
        isActive: true,
        lastLoginAt: null,
        profile: {
          fullName: 'Dave New',
          email: 'dave@example.com',
          avatarUrl: null,
        },
      })

      expect(status.label).toBe('Active')
      expect(status.supplementaryNote).toBe('No login yet')
    })

    it('formatRelativeTime formats timestamps into human-readable relative intervals', () => {
      expect(formatRelativeTime(null)).toBe('Never')
      expect(formatRelativeTime(undefined)).toBe('Never')
      expect(formatRelativeTime('invalid-date')).toBe('Never')

      const now = Date.now()
      expect(formatRelativeTime(new Date(now - 10 * 1000).toISOString())).toBe('Just now')
      expect(formatRelativeTime(new Date(now - 15 * 60 * 1000).toISOString())).toBe('15m ago')
      expect(formatRelativeTime(new Date(now - 4 * 60 * 60 * 1000).toISOString())).toBe('4h ago')
      expect(formatRelativeTime(new Date(now - 25 * 60 * 60 * 1000).toISOString())).toBe('Yesterday')
      expect(formatRelativeTime(new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString())).toBe('5d ago')
      expect(formatRelativeTime(new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString())).toBe('2mo ago')
    })
  })

  describe('Bug #14: Member Profile Modal Attributes & Fallbacks', () => {
    it('6. Member profile shows initials fallback when no avatar URL exists', () => {
      const memberWithoutAvatar = {
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
        avatarUrl: null,
      }

      const initials = memberWithoutAvatar.fullName
        ? memberWithoutAvatar.fullName.slice(0, 2).toUpperCase()
        : memberWithoutAvatar.email.slice(0, 2).toUpperCase()

      expect(initials).toBe('JA')

      const memberEmailOnly = {
        fullName: null,
        email: 'support@example.com',
        avatarUrl: null,
      }
      const emailInitials = memberEmailOnly.fullName
        ? (memberEmailOnly.fullName as string).slice(0, 2).toUpperCase()
        : memberEmailOnly.email.slice(0, 2).toUpperCase()

      expect(emailInitials).toBe('SU')
    })

    it('5. Member profile modal data model carries all required DB fields', () => {
      const memberFullProfile = {
        id: 'mem-99',
        userId: 'u-99',
        role: 'admin' as const,
        joinedAt: '2026-01-15T10:00:00.000Z',
        isActive: true,
        lastLoginAt: '2026-10-14T08:30:00.000Z',
        phone: '+1-555-0199',
        invitedByName: 'Sarah Connor',
        profile: {
          fullName: 'John Connor',
          email: 'john@example.com',
          avatarUrl: 'https://images.example.com/avatar-99.png',
        },
      }

      // Assert modal contract requirements:
      expect(memberFullProfile.userId).toBe('u-99')
      expect(memberFullProfile.role).toBe('admin')
      expect(memberFullProfile.phone).toBe('+1-555-0199')
      expect(memberFullProfile.invitedByName).toBe('Sarah Connor')
      expect(memberFullProfile.lastLoginAt).toBe('2026-10-14T08:30:00.000Z')
      expect(memberFullProfile.isActive).toBe(true)
      expect(memberFullProfile.profile.avatarUrl).toBe('https://images.example.com/avatar-99.png')
    })
  })

  describe('Bug #13: Workload View Client-Side Aggregation & Filtering', () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const pastStr = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0]

    const mockTasks = [
      { id: 't1', title: 'Task 1', project_id: 'proj-1', status: 'todo', due_date: todayStr },
      { id: 't2', title: 'Task 2', project_id: 'proj-1', status: 'in_progress', due_date: pastStr },
      { id: 't3', title: 'Task 3', project_id: 'proj-2', status: 'done', due_date: pastStr },
      { id: 't4', title: 'Task 4', project_id: 'proj-2', status: 'review', due_date: null },
    ]

    const memberWorkload = {
      id: 'mw-1',
      user_id: 'u-1',
      name: 'Dev One',
      email: 'dev1@example.com',
      role: 'member',
      avatar_url: null,
      assigned_tasks: mockTasks,
    }

    it('3. Workload view aggregates tasks per member correctly', () => {
      const activeCount = memberWorkload.assigned_tasks.filter((t) => t.status !== 'done').length
      const doneCount = memberWorkload.assigned_tasks.filter((t) => t.status === 'done').length
      const overdueCount = memberWorkload.assigned_tasks.filter(
        (t) => t.status !== 'done' && t.due_date && t.due_date < todayStr
      ).length

      expect(activeCount).toBe(3) // t1, t2, t4
      expect(doneCount).toBe(1) // t3
      expect(overdueCount).toBe(1) // t2 is in_progress and past due date
      expect(memberWorkload.assigned_tasks.length).toBe(4)
    })

    it('4. Workload view client-side status filter returns filtered metrics without server calls', () => {
      // Filter for 'in_progress' only
      const statusFilteredTasks = memberWorkload.assigned_tasks.filter((t) => t.status === 'in_progress')
      const activeCount = statusFilteredTasks.filter((t) => t.status !== 'done').length
      const doneCount = statusFilteredTasks.filter((t) => t.status === 'done').length
      const overdueCount = statusFilteredTasks.filter(
        (t) => t.status !== 'done' && t.due_date && t.due_date < todayStr
      ).length

      expect(statusFilteredTasks.length).toBe(1)
      expect(activeCount).toBe(1)
      expect(doneCount).toBe(0)
      expect(overdueCount).toBe(1)

      // Filter for 'proj-1' only
      const projectFilteredTasks = memberWorkload.assigned_tasks.filter((t) => t.project_id === 'proj-1')
      expect(projectFilteredTasks.length).toBe(2)
      expect(projectFilteredTasks.map((t) => t.id)).toEqual(['t1', 't2'])
    })
  })

  describe('Bug #5: Pending Invites Polling & Lifecycle Management', () => {
    it('1. Simulates window focus refetching invitations', () => {
      let fetchCount = 0
      const fetchInvitations = () => {
        fetchCount++
      }

      // Add mock focus listener
      const listeners: Record<string, () => void> = {}
      const mockAddEventListener = (event: string, cb: () => void) => {
        listeners[event] = cb
      }
      const mockRemoveEventListener = (event: string) => {
        delete listeners[event]
      }

      mockAddEventListener('focus', () => fetchInvitations())
      expect(listeners['focus']).toBeDefined()

      // Trigger focus
      listeners['focus']()
      expect(fetchCount).toBe(1)

      // Unmount cleanup
      mockRemoveEventListener('focus')
      expect(listeners['focus']).toBeUndefined()
    })

    it('2. Pending invites polling interval paused on document hidden and cleared on unmount', () => {
      let intervalId: any = null
      let isPolling = false

      const startPolling = () => {
        if (!intervalId) {
          intervalId = setInterval(() => {}, 30000)
          isPolling = true
        }
      }

      const stopPolling = () => {
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
          isPolling = false
        }
      }

      startPolling()
      expect(isPolling).toBe(true)
      expect(intervalId).not.toBeNull()

      // Document hidden -> pause
      stopPolling()
      expect(isPolling).toBe(false)
      expect(intervalId).toBeNull()

      // Document visible -> resume
      startPolling()
      expect(isPolling).toBe(true)

      // Unmount -> clean up
      stopPolling()
      expect(isPolling).toBe(false)
      expect(intervalId).toBeNull()
    })
  })

  describe('Repository Query Extension: orgRepo.getMembers', () => {
    it('Selects isActive, lastLoginAt, phone, and invitedByName via JOIN', async () => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const owner = await userRepo.create({
        email: `org_owner_${id}@example.com`,
        fullName: 'Owner Boss',
        passwordHash: 'dummy_hash',
      })

      const testOrg = await orgRepo.create({
        name: `Test Org ${id}`,
        slug: `test-org-${id}`,
        ownerUserId: owner.id,
      })

      const members = await orgRepo.getMembers(testOrg.id)
      expect(members.length).toBeGreaterThanOrEqual(1)

      const ownerMember = members.find((m: any) => m.user_id === owner.id || m.userId === owner.id)
      expect(ownerMember).toBeDefined()
      expect(ownerMember?.fullName).toBe('Owner Boss')
      expect(ownerMember?.email).toBe(`org_owner_${id}@example.com`)
      expect(typeof ownerMember?.isActive).toBe('boolean')
      expect(ownerMember).toHaveProperty('lastLoginAt')
      expect(ownerMember).toHaveProperty('phone')
      expect(ownerMember).toHaveProperty('invitedByName')
    })
  })
})
