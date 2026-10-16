import { getCurrentSessionContext, SessionContext } from '@/lib/auth/session'
import { OrgRole } from '@/lib/auth/permissions'

export type Session = SessionContext

/**
 * Enforces role-based access control (RBAC) on server actions.
 * Verifies that the caller has an active authenticated session and belongs to
 * an authorized role within their active tenant organization.
 * 
 * Throws:
 * - 'UNAUTHENTICATED' if no active session or organization context exists
 * - 'INSUFFICIENT_ROLE' if the user's role is not included in allowedRoles
 */
export async function requireRole(
  allowedRoles: OrgRole[]
): Promise<SessionContext> {
  const session = await getCurrentSessionContext()

  if (!session || !session.user || !session.organization) {
    throw new Error('UNAUTHENTICATED')
  }

  // Super-admin impersonation bypasses standard role restrictions
  if (session.isSuperAdmin) {
    return session
  }

  const role = session.role as OrgRole
  if (!allowedRoles.includes(role)) {
    throw new Error('INSUFFICIENT_ROLE')
  }

  return session
}
