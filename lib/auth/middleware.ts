import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';

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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);

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
