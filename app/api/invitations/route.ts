import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { createInvitation } from '@/lib/services/invitation-service';
import { invitationRepo } from '@/lib/db/repositories/invitation-repo';
import { isValidEmail } from '@/lib/validation/email';
import { checkRateLimit, createRateLimitExceededResponse, INVITE_RATE_LIMITS } from '@/lib/security/rate-limit';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/response';
import { InvitationRole, InvitationStatus } from '@/lib/types/database';

/**
 * GET /api/invitations
 * List invitations for the current session's organization.
 * Filters: status, page size (default 25), cursor.
 * Guarantees zero leakage of token_hash.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !auth.orgId) {
      return apiError('Unauthorized: Active organization session required', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = request.nextUrl;
    const rawStatus = searchParams.get('status');
    const validStatuses = ['pending', 'accepted', 'revoked', 'expired', 'all'];
    const statusFilter = rawStatus && validStatuses.includes(rawStatus)
      ? (rawStatus as InvitationStatus | 'all')
      : undefined;

    const cursor = searchParams.get('cursor') || undefined;
    const limitParam = parseInt(searchParams.get('limit') || '25', 10);
    const limit = Math.min(Math.max(isNaN(limitParam) ? 25 : limitParam, 1), 100);

    const rawInvitations = await invitationRepo.listForOrg(
      auth.orgId,
      statusFilter,
      cursor,
      limit
    );

    // Strip sensitive token_hash and any internal secrets
    const sanitizedInvitations = rawInvitations.map(({ token_hash, ...inv }) => inv);

    return apiSuccess({
      invitations: sanitizedInvitations,
      count: sanitizedInvitations.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/invitations
 * Create a new invitation for the session's organization.
 * Body: { email, role }. Rejects unknown fields.
 * Returns: 201 (safe invitation without token), 409 (already member), 402 (quota limit), 403 (forbidden), 400 (invalid).
 */
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !auth.orgId) {
      return apiError('Unauthorized: Active organization session required', 401, 'UNAUTHORIZED');
    }

    // Rate limiting: 20 per hour per user
    const rateLimit = checkRateLimit(`invite:create:${auth.userId}`, INVITE_RATE_LIMITS.INVITE_CREATE);
    if (!rateLimit.allowed) {
      return createRateLimitExceededResponse(rateLimit);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid JSON payload', 400, 'INVALID_INPUT');
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return apiError('Request body must be a JSON object', 400, 'INVALID_INPUT');
    }

    // Strict validation: reject any unknown fields
    const allowedKeys = ['email', 'role', 'password'];
    const bodyKeys = Object.keys(body);
    const hasUnknownKeys = bodyKeys.some((key) => !allowedKeys.includes(key));
    if (hasUnknownKeys) {
      return apiError(
        'Invalid request body: unknown fields are not permitted',
        400,
        'INVALID_INPUT'
      );
    }

    if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
      return apiError('Email is required', 400, 'INVALID_INPUT');
    }

    if (!isValidEmail(body.email)) {
      return apiError('Invalid email format', 400, 'INVALID_INPUT');
    }

    const role = (body.role || 'member') as InvitationRole;
    if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
      return apiError("Role must be 'admin', 'member', or 'viewer'", 400, 'INVALID_INPUT');
    }

    if (body.password !== undefined && (typeof body.password !== 'string' || !body.password.trim())) {
      return apiError('Password must be a non-empty string when provided', 400, 'INVALID_INPUT');
    }

    // Call invitation service
    const result = await createInvitation(
      {
        userId: auth.userId,
        orgId: auth.orgId,
        email: auth.email,
        isSuperAdmin: auth.role === 'super_admin',
      },
      {
        email: body.email,
        role,
        password: body.password ? body.password.trim() : undefined,
      }
    );

    if (!result.success) {
      if (result.error === 'already_member') {
        return apiError(result.message, 409, 'ALREADY_MEMBER');
      }

      const errStr = result.error as string;
      if (
        errStr === 'LIMIT_REACHED' ||
        errStr === 'seat_limit' ||
        errStr === 'pending_limit' ||
        errStr === 'seat_limit_reached' ||
        errStr === 'pending_limit_reached'
      ) {
        const code =
          (result as any).code ||
          (errStr.includes('pending') ? 'PENDING_LIMIT_REACHED' : 'SEAT_LIMIT_REACHED');
        const limit = (result as any).limit;
        const currentCount = (result as any).currentCount ?? (result as any).current;
        const planName = (result as any).planName || 'Free';
        const upgradeUrl = (result as any).upgradeUrl || '/settings/billing';

        return NextResponse.json(
          {
            success: false,
            error: {
              code,
              message: result.message,
              currentCount,
              limit,
              planName,
              upgradeUrl,
              details: {
                currentCount,
                limit,
                planName,
                upgradeUrl,
              },
            },
          },
          { status: 402 }
        );
      }

      if (result.error === 'forbidden') {
        const code = (result as any).code || 'INSUFFICIENT_ROLE';
        return apiError(result.message, 403, code, {
          requiredRole: (result as any).requiredRole,
          yourRole: (result as any).yourRole,
        });
      }

      if (result.error === 'unauthorized') {
        return apiError(result.message, 401, 'UNAUTHORIZED');
      }

      return apiError(result.message, 400, 'INVALID_INPUT');
    }

    // Sanitize: never return rawToken, token_hash, or temp_password_hash in response payload
    const { token_hash, temp_password_hash, ...safeInvitation } = result.invitation as any;

    const baseUrl = (process.env.APP_PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');
    const inviteLink = result.rawToken ? `${baseUrl}/invite/${result.rawToken}` : undefined;

    return apiSuccess(
      {
        invitation: safeInvitation,
        alreadyPending: result.alreadyPending || false,
        sendFailed: result.sendFailed || false,
        warning: result.warning,
        ...(inviteLink ? { inviteLink } : {}),
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
