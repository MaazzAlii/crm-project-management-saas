import { getCurrentSessionContext, SessionContext } from '@/lib/auth/session'
import { OrgRole } from '@/lib/auth/permissions'

export type Session = SessionContext & {
  organization: NonNullable<SessionContext['organization']>
  user: NonNullable<SessionContext['user']>
}

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
): Promise<Session> {
  const session = await getCurrentSessionContext()

  if (!session || !session.user || !session.organization) {
    throw new Error('UNAUTHENTICATED')
  }

  const authenticatedSession = session as Session

  // Super-admin impersonation bypasses standard role restrictions
  if (authenticatedSession.isSuperAdmin) {
    return authenticatedSession
  }

  const role = authenticatedSession.role as OrgRole
  if (!allowedRoles.includes(role)) {
    throw new Error('INSUFFICIENT_ROLE')
  }

  return authenticatedSession
}
