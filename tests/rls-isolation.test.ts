import { describe, it, expect } from 'vitest'

/**
 * RLS Policy Evaluation Model
 * Replicates Postgres RLS policies from 0008_rls_policies.sql, 0010_super_admin_rls.sql, and 0026_client_portal_auth.sql
 * to verify tenant isolation, super-admin scoping, and portal boundary logic.
 */
interface MockAuthContext {
  userId: string
  isSuperAdmin: boolean
  orgMemberships: Record<string, 'owner' | 'admin' | 'member'> // orgId -> role
  portalUser?: {
    clientId: string
    organizationId: string
    isActive: boolean
    planEnabled: boolean
  }
}

// Helper functions mirroring SQL SECURITY DEFINER functions
function isOrgMember(ctx: MockAuthContext, targetOrgId: string): boolean {
  return targetOrgId in ctx.orgMemberships
}

function isSuperAdmin(ctx: MockAuthContext): boolean {
  return ctx.isSuperAdmin
}

function getUserOrgRole(ctx: MockAuthContext, targetOrgId: string): 'owner' | 'admin' | 'member' | null {
  return ctx.orgMemberships[targetOrgId] || null
}

function getPortalClientId(ctx: MockAuthContext): string | null {
  if (ctx.portalUser && ctx.portalUser.isActive) {
    return ctx.portalUser.clientId
  }
  return null
}

function isPortalUser(ctx: MockAuthContext): boolean {
  return getPortalClientId(ctx) !== null
}

function portalPlanEnabled(ctx: MockAuthContext): boolean {
  return !!(ctx.portalUser && ctx.portalUser.isActive && ctx.portalUser.planEnabled)
}

// RLS Policy checks
const Policies = {
  clients: {
    select: (ctx: MockAuthContext, row: { id: string; organization_id: string }) => {
      // Org members OR super admins OR portal users scoped to their client_id
      return (
        isOrgMember(ctx, row.organization_id) ||
        isSuperAdmin(ctx) ||
        (isPortalUser(ctx) && row.id === getPortalClientId(ctx) && portalPlanEnabled(ctx))
      )
    },
    insert: (ctx: MockAuthContext, row: { organization_id: string }) => {
      return isOrgMember(ctx, row.organization_id)
    },
    update: (ctx: MockAuthContext, row: { organization_id: string }) => {
      return isOrgMember(ctx, row.organization_id)
    },
    delete: (ctx: MockAuthContext, row: { organization_id: string }) => {
      const role = getUserOrgRole(ctx, row.organization_id)
      return isOrgMember(ctx, row.organization_id) && (role === 'owner' || role === 'admin')
    },
  },

  projects: {
    select: (ctx: MockAuthContext, row: { id: string; organization_id: string; client_id: string }) => {
      return (
        isOrgMember(ctx, row.organization_id) ||
        isSuperAdmin(ctx) ||
        (isPortalUser(ctx) && row.client_id === getPortalClientId(ctx) && portalPlanEnabled(ctx))
      )
    },
    manage: (ctx: MockAuthContext, row: { organization_id: string }) => {
      return isOrgMember(ctx, row.organization_id)
    },
  },

  tasks: {
    select: (ctx: MockAuthContext, row: { organization_id: string; client_id: string }) => {
      return (
        isOrgMember(ctx, row.organization_id) ||
        isSuperAdmin(ctx) ||
        (isPortalUser(ctx) && row.client_id === getPortalClientId(ctx) && portalPlanEnabled(ctx))
      )
    },
    manage: (ctx: MockAuthContext, row: { organization_id: string }) => {
      return isOrgMember(ctx, row.organization_id)
    },
  },

  communications: {
    select: (ctx: MockAuthContext, row: { organization_id: string }) => {
      return isOrgMember(ctx, row.organization_id) || isSuperAdmin(ctx)
    },
    insert: (ctx: MockAuthContext, row: { organization_id: string }) => {
      return isOrgMember(ctx, row.organization_id)
    },
  },
}

describe('Row-Level Security (RLS) Multi-Tenant Isolation', () => {
  const orgA = 'org-aaa-111'
  const orgB = 'org-bbb-222'

  const userOrgAAdmin: MockAuthContext = {
    userId: 'user-a-admin',
    isSuperAdmin: false,
    orgMemberships: { [orgA]: 'admin' },
  }

  const userOrgAMember: MockAuthContext = {
    userId: 'user-a-member',
    isSuperAdmin: false,
    orgMemberships: { [orgA]: 'member' },
  }

  const userOrgB: MockAuthContext = {
    userId: 'user-b',
    isSuperAdmin: false,
    orgMemberships: { [orgB]: 'owner' },
  }

  const superAdminUser: MockAuthContext = {
    userId: 'user-super-admin',
    isSuperAdmin: true,
    orgMemberships: {},
  }

  const portalUserOrgAClient1: MockAuthContext = {
    userId: 'user-portal-1',
    isSuperAdmin: false,
    orgMemberships: {},
    portalUser: {
      clientId: 'client-a-1',
      organizationId: orgA,
      isActive: true,
      planEnabled: true,
    },
  }

  describe('Tenant Boundary Isolation (Org A vs Org B)', () => {
    const clientA = { id: 'client-a-1', organization_id: orgA }
    const clientB = { id: 'client-b-1', organization_id: orgB }

    it('allows Org A users to view Org A clients, but strictly blocks Org B clients', () => {
      expect(Policies.clients.select(userOrgAAdmin, clientA)).toBe(true)
      expect(Policies.clients.select(userOrgAAdmin, clientB)).toBe(false)

      expect(Policies.clients.select(userOrgB, clientB)).toBe(true)
      expect(Policies.clients.select(userOrgB, clientA)).toBe(false)
    })

    it('blocks Org A users from inserting, updating, or deleting Org B clients', () => {
      expect(Policies.clients.insert(userOrgAAdmin, clientB)).toBe(false)
      expect(Policies.clients.update(userOrgAAdmin, clientB)).toBe(false)
      expect(Policies.clients.delete(userOrgAAdmin, clientB)).toBe(false)
    })

    it('allows only Org Owners and Admins to delete clients within their organization', () => {
      expect(Policies.clients.delete(userOrgAAdmin, clientA)).toBe(true)
      expect(Policies.clients.delete(userOrgAMember, clientA)).toBe(false) // regular member blocked
    })

    it('strictly isolates projects and tasks between tenants', () => {
      const projectA = { id: 'proj-a-1', organization_id: orgA, client_id: 'client-a-1' }
      const projectB = { id: 'proj-b-1', organization_id: orgB, client_id: 'client-b-1' }

      expect(Policies.projects.select(userOrgAAdmin, projectA)).toBe(true)
      expect(Policies.projects.select(userOrgAAdmin, projectB)).toBe(false)
      expect(Policies.projects.manage(userOrgAAdmin, projectB)).toBe(false)

      const taskA = { organization_id: orgA, client_id: 'client-a-1' }
      const taskB = { organization_id: orgB, client_id: 'client-b-1' }
      expect(Policies.tasks.select(userOrgAAdmin, taskA)).toBe(true)
      expect(Policies.tasks.select(userOrgAAdmin, taskB)).toBe(false)
    })

    it('strictly isolates communication messages between tenants', () => {
      const messageA = { organization_id: orgA }
      const messageB = { organization_id: orgB }

      expect(Policies.communications.select(userOrgAAdmin, messageA)).toBe(true)
      expect(Policies.communications.select(userOrgAAdmin, messageB)).toBe(false)
      expect(Policies.communications.insert(userOrgAAdmin, messageB)).toBe(false)
    })
  })

  describe('Client Portal Authentication Boundary', () => {
    it('allows portal user to read only their own client and projects', () => {
      const myClient = { id: 'client-a-1', organization_id: orgA }
      const otherClientInSameOrg = { id: 'client-a-2', organization_id: orgA }
      const otherClientInOtherOrg = { id: 'client-b-1', organization_id: orgB }

      expect(Policies.clients.select(portalUserOrgAClient1, myClient)).toBe(true)
      expect(Policies.clients.select(portalUserOrgAClient1, otherClientInSameOrg)).toBe(false)
      expect(Policies.clients.select(portalUserOrgAClient1, otherClientInOtherOrg)).toBe(false)

      const myProject = { id: 'p1', organization_id: orgA, client_id: 'client-a-1' }
      const otherProject = { id: 'p2', organization_id: orgA, client_id: 'client-a-2' }
      expect(Policies.projects.select(portalUserOrgAClient1, myProject)).toBe(true)
      expect(Policies.projects.select(portalUserOrgAClient1, otherProject)).toBe(false)
    })

    it('blocks portal users from writing or managing tenant data', () => {
      const myClient = { id: 'client-a-1', organization_id: orgA }
      const myProject = { id: 'p1', organization_id: orgA, client_id: 'client-a-1' }

      expect(Policies.clients.insert(portalUserOrgAClient1, myClient)).toBe(false)
      expect(Policies.clients.update(portalUserOrgAClient1, myClient)).toBe(false)
      expect(Policies.clients.delete(portalUserOrgAClient1, myClient)).toBe(false)
      expect(Policies.projects.manage(portalUserOrgAClient1, myProject)).toBe(false)
    })

    it('blocks portal user when portal plan is not enabled on organization subscription', () => {
      const disabledPlanPortalUser: MockAuthContext = {
        userId: 'user-portal-disabled',
        isSuperAdmin: false,
        orgMemberships: {},
        portalUser: {
          clientId: 'client-a-1',
          organizationId: orgA,
          isActive: true,
          planEnabled: false, // Plan does not include portal
        },
      }
      const myClient = { id: 'client-a-1', organization_id: orgA }
      expect(Policies.clients.select(disabledPlanPortalUser, myClient)).toBe(false)
    })
  })

  describe('Super Admin Access Boundary', () => {
    it('allows super admin to read tenant data across all organizations', () => {
      const clientA = { id: 'client-a-1', organization_id: orgA }
      const clientB = { id: 'client-b-1', organization_id: orgB }

      expect(Policies.clients.select(superAdminUser, clientA)).toBe(true)
      expect(Policies.clients.select(superAdminUser, clientB)).toBe(true)
    })

    it('restricts direct write access on tenant data to org members only (per Migration 10)', () => {
      // Super admins modify tenant data only via support impersonation workflows
      const clientA = { organization_id: orgA }
      expect(Policies.clients.insert(superAdminUser, clientA)).toBe(false)
      expect(Policies.clients.update(superAdminUser, clientA)).toBe(false)
      expect(Policies.clients.delete(superAdminUser, clientA)).toBe(false)
    })
  })
})
