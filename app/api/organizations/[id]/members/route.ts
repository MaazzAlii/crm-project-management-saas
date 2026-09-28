import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { orgService } from '@/lib/services/org-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/response';

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
    const members = await orgService.getMembers(id);
    return apiSuccess(members);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
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
    if (!body.email) {
      return apiError('Email is required', 400, 'VALIDATION_ERROR');
    }

    const member = await orgService.addMember(
      id,
      auth.userId,
      body.email,
      body.role || 'member'
    );

    return apiSuccess(member, 201);
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

    const updated = await orgService.updateMemberRole(
      id,
      auth.userId,
      body.userId,
      body.role
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

    const removed = await orgService.removeMember(id, auth.userId, targetUserId);
    return apiSuccess({ removed: true, userId: targetUserId });
  } catch (error) {
    return handleApiError(error);
  }
}
