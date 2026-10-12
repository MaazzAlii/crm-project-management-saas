import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from './jwt';

export interface AuthContext {
  userId: string;
  email: string;
  role: 'user' | 'org_admin' | 'super_admin';
  orgId?: string;
}

/**
 * Extract and verify JWT from Authorization header
 */
export function getAuthFromRequest(request: NextRequest): AuthContext | null {
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = request.cookies?.get('innoventix_session')?.value || request.cookies?.get('session')?.value || null;
  }

  if (!token) {
    return null;
  }

  let payload = verifyAccessToken(token);
  if (!payload) {
    const refreshPayload = verifyRefreshToken(token);
    if (refreshPayload) {
      payload = {
        userId: refreshPayload.userId,
        email: refreshPayload.email || '',
        role: (refreshPayload.role as any) || 'user',
        orgId: refreshPayload.orgId,
      };
    }
  }

  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    orgId: payload.orgId,
  };
}

/**
 * Middleware for protected routes
 */
export function withAuth(
  handler: (request: NextRequest, auth: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const auth = getAuthFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    return handler(request, auth);
  };
}

/**
 * Middleware for role-based access control
 */
export function withRole(
  requiredRoles: AuthContext['role'][],
  handler: (request: NextRequest, auth: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const auth = getAuthFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    if (!requiredRoles.includes(auth.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, auth);
  };
}

/**
 * Resolves the tenant organization ID strictly from auth session.
 * If the request query string or body contains an organization ID that mismatches auth.orgId,
 * returns { error: 'Organization not found', status: 404 } to strictly prevent tenant cross-probing.
 */
export function getTenantOrgId(
  request: NextRequest,
  auth: AuthContext | null,
  bodyPayload?: any
): { orgId: string } | { error: string; status: number } {
  if (!auth) {
    return { error: 'Unauthorized', status: 401 };
  }
  const sessionOrgId = auth.orgId;
  if (!sessionOrgId) {
    return { error: 'Organization context required', status: 400 };
  }

  // Check query parameters for cross-tenant probe
  const url = new URL(request.url);
  const qOrg = url.searchParams.get('orgId') || url.searchParams.get('organizationId') || url.searchParams.get('organization_id');
  if (qOrg && qOrg !== sessionOrgId) {
    return { error: 'Organization not found', status: 404 };
  }

  // Check body payload if provided
  if (bodyPayload && typeof bodyPayload === 'object') {
    const bOrg = bodyPayload.orgId || bodyPayload.organizationId || bodyPayload.organization_id;
    if (bOrg && bOrg !== sessionOrgId) {
      return { error: 'Organization not found', status: 404 };
    }
  }

  return { orgId: sessionOrgId };
}
