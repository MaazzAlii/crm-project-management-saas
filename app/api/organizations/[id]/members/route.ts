import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { orgService } from '@/lib/services/org-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

import { queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = await params;

    // Membership check: only members or super_admins can view organization members
    if (auth.role !== 'super_admin') {
      const membership = await queryOne(
        `SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
        [id, auth.userId]
      );
      if (!membership) {
        return apiError('Organization not found', 404, 'NOT_FOUND');
      }
    }

    const members = await orgService.getMembers(id);
    return apiSuccess(members);
  } catch (error) {
    return handleApiError(error);
  }
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = await params;
    const body = await request.json();
    if (!body.userId || !body.role) {
      return apiError('userId and role are required', 400, 'VALIDATION_ERROR');
    }

    const isSuperAdmin = auth.role === 'super_admin';
    const updated = await orgService.updateMemberRole(
      id,
      auth.userId,
      body.userId,
      body.role,
      isSuperAdmin
    );

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const targetUserId = searchParams.get('userId');
    if (!targetUserId) {
      return apiError('userId parameter is required', 400, 'VALIDATION_ERROR');
    }

    const isSuperAdmin = auth.role === 'super_admin';
    const removed = await orgService.removeMember(id, auth.userId, targetUserId, isSuperAdmin);
    return apiSuccess({ removed: true, userId: targetUserId });
  } catch (error) {
    return handleApiError(error);
  }
}
