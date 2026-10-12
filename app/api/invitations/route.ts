import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { createInvitation } from '@/lib/services/invitation-service';
import { invitationRepo } from '@/lib/db/repositories/invitation-repo';
import { isValidEmail } from '@/lib/validation/email';
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
    const allowedKeys = ['email', 'role'];
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
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return apiError("Role must be 'admin', 'member', or 'viewer'", 400, 'INVALID_INPUT');
    }

    // Call invitation service
    const result = await createInvitation(
      {
        userId: auth.userId,
        orgId: auth.orgId,
        email: auth.email,
      },
      {
        email: body.email,
        role,
      }
    );

    if (!result.success) {
      if (result.error === 'already_member') {
        return apiError(result.message, 409, 'ALREADY_MEMBER');
      }

      if (
        result.error === 'LIMIT_REACHED' ||
        result.error === 'seat_limit' ||
        result.error === 'pending_limit'
      ) {
        return apiError(result.message, 402, 'LIMIT_REACHED', {
          limit: (result as any).limit,
          planName: (result as any).planName,
        });
      }

      if (result.error === 'forbidden') {
        return apiError(result.message, 403, 'FORBIDDEN');
      }

      if (result.error === 'unauthorized') {
        return apiError(result.message, 401, 'UNAUTHORIZED');
      }

      return apiError(result.message, 400, 'INVALID_INPUT');
    }

    // Sanitize: never return rawToken or token_hash in response payload
    const { token_hash, ...safeInvitation } = result.invitation as any;

    return apiSuccess(
      {
        invitation: safeInvitation,
        alreadyPending: result.alreadyPending || false,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
