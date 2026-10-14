/**
 * Centralized Role-Based Access Control (RBAC) Permissions Utility
 * 
 * Enforces role boundaries across invitations, role modifications,
 * and member removals according to the strict hierarchy:
 * owner > admin > member > viewer (with billing_manager as scoped role).
 */

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer' | 'billing_manager';

export interface Actor {
  userId: string;
  role: OrgRole;
  orgId?: string;
  isSuperAdmin?: boolean;
}

export interface Target {
  userId: string;
  role: OrgRole;
  orgId?: string;
}

export interface PermissionResult {
  allowed: boolean;
  code?: 'INSUFFICIENT_ROLE' | 'LAST_OWNER_PROTECTED' | 'CANNOT_TARGET_SELF' | 'TENANT_MISMATCH';
  message?: string;
  requiredRole?: OrgRole;
  yourRole?: OrgRole;
}

/**
 * Determine if an actor is authorized to invite a new user with the specified role.
 */
export function canInviteWithRole(actor: Actor, inviteRole: OrgRole): PermissionResult {
  if (actor.isSuperAdmin) {
    if (inviteRole === 'owner') {
      return {
        allowed: false,
        code: 'INSUFFICIENT_ROLE',
        message: 'Organizations cannot invite additional owners. Transfer ownership instead.',
        requiredRole: 'owner',
        yourRole: actor.role,
      };
    }
    return { allowed: true };
  }

  // 1. Owner invitations are prohibited (organizations must transfer ownership, not invite co-owners via link)
  if (inviteRole === 'owner') {
    return {
      allowed: false,
      code: 'INSUFFICIENT_ROLE',
      message: 'Organizations cannot invite additional owners. Transfer ownership instead.',
      requiredRole: 'owner',
      yourRole: actor.role,
    };
  }

  // 2. Members, Viewers, Billing Managers cannot invite anyone
  if (actor.role !== 'owner' && actor.role !== 'admin') {
    return {
      allowed: false,
      code: 'INSUFFICIENT_ROLE',
      message: 'Only owners and admins can invite new members.',
      requiredRole: 'admin',
      yourRole: actor.role,
    };
  }

  // 3. Admins cannot invite another Admin
  if (actor.role === 'admin' && inviteRole === 'admin') {
    return {
      allowed: false,
      code: 'INSUFFICIENT_ROLE',
      message: 'Only the organization owner can invite admins.',
      requiredRole: 'owner',
      yourRole: 'admin',
    };
  }

  // 4. Owners can invite admin, member, viewer, billing_manager
  // Admins can invite member, viewer, billing_manager
  return { allowed: true };
}

/**
 * Determine if an actor is authorized to update a target member's role.
 */
export function canChangeRole(
  actor: Actor,
  target: Target,
  newRole: OrgRole,
  ownerCount: number = 1
): PermissionResult {
  // 1. Cross-tenant isolation
  if (actor.orgId && target.orgId && actor.orgId !== target.orgId) {
    return {
      allowed: false,
      code: 'TENANT_MISMATCH',
      message: 'Cannot modify members of another organization.',
    };
  }

  // 2. Last-owner demotion protection (takes precedence if target is sole owner)
  if (target.role === 'owner' && newRole !== 'owner' && ownerCount <= 1) {
    return {
      allowed: false,
      code: 'LAST_OWNER_PROTECTED',
      message: 'Cannot demote the sole organization owner. Transfer ownership first.',
      requiredRole: 'owner',
      yourRole: actor.role,
    };
  }

  // 3. Cannot change own role
  if (actor.userId === target.userId) {
    return {
      allowed: false,
      code: 'CANNOT_TARGET_SELF',
      message: 'Cannot change your own role.',
      yourRole: actor.role,
    };
  }

  if (actor.isSuperAdmin) {
    return { allowed: true };
  }

  // 4. Members, Viewers, Billing Managers cannot change any roles
  if (actor.role !== 'owner' && actor.role !== 'admin') {
    return {
      allowed: false,
      code: 'INSUFFICIENT_ROLE',
      message: 'Only organization owners and admins can update member roles.',
      requiredRole: 'admin',
      yourRole: actor.role,
    };
  }

  // 5. Admins have restricted authority:
  if (actor.role === 'admin') {
    // Cannot touch Owner or Admin
    if (target.role === 'owner' || target.role === 'admin') {
      return {
        allowed: false,
        code: 'INSUFFICIENT_ROLE',
        message: 'Admins cannot change roles of owners or other admins.',
        requiredRole: 'owner',
        yourRole: 'admin',
      };
    }

    // Cannot promote anyone to Admin or Owner
    if (newRole === 'admin' || newRole === 'owner') {
      return {
        allowed: false,
        code: 'INSUFFICIENT_ROLE',
        message: 'Only the organization owner can change roles to admin.',
        requiredRole: 'owner',
        yourRole: 'admin',
      };
    }

    // Allowed: admin can change member <-> viewer <-> billing_manager
    return { allowed: true };
  }

  // 6. Owner can change anyone else's role
  return { allowed: true };
}

/**
 * Determine if an actor is authorized to remove a target member.
 */
export function canRemoveMember(
  actor: Actor,
  target: Target,
  ownerCount: number = 1
): PermissionResult {
  // 1. Cross-tenant isolation
  if (actor.orgId && target.orgId && actor.orgId !== target.orgId) {
    return {
      allowed: false,
      code: 'TENANT_MISMATCH',
      message: 'Cannot remove members from another organization.',
    };
  }

  // 2. Sole owner removal protection
  if (target.role === 'owner' && ownerCount <= 1) {
    return {
      allowed: false,
      code: 'LAST_OWNER_PROTECTED',
      message: 'Cannot remove the sole organization owner. Transfer ownership first.',
      requiredRole: 'owner',
      yourRole: actor.role,
    };
  }

  if (actor.isSuperAdmin) {
    return { allowed: true };
  }

  // 3. Members, Viewers, Billing Managers cannot remove anyone
  if (actor.role !== 'owner' && actor.role !== 'admin') {
    return {
      allowed: false,
      code: 'INSUFFICIENT_ROLE',
      message: 'Forbidden: Only owners and admins can remove team members.',
      requiredRole: 'admin',
      yourRole: actor.role,
    };
  }

  // 4. Admin restrictions:
  if (actor.role === 'admin') {
    // Admin cannot remove self via team member list
    if (actor.userId === target.userId) {
      return {
        allowed: false,
        code: 'CANNOT_TARGET_SELF',
        message: 'Admins cannot remove themselves via team management.',
        yourRole: 'admin',
      };
    }

    // Admin cannot remove Owner
    if (target.role === 'owner') {
      return {
        allowed: false,
        code: 'INSUFFICIENT_ROLE',
        message: 'Forbidden: Admins cannot remove the organization owner.',
        requiredRole: 'owner',
        yourRole: 'admin',
      };
    }

    // Admin cannot remove another Admin
    if (target.role === 'admin') {
      return {
        allowed: false,
        code: 'INSUFFICIENT_ROLE',
        message: 'Forbidden: Admins cannot remove other admins.',
        requiredRole: 'owner',
        yourRole: 'admin',
      };
    }

    // Admin can remove member, viewer, billing_manager
    return { allowed: true };
  }

  // 5. Owner restrictions:
  // Owner can remove members, viewers, billing_managers, admins, and co-owners (if ownerCount > 1)
  return { allowed: true };
}
