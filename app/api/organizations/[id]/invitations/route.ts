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
    const invitations = await orgService.getInvitations(id);
    return apiSuccess(invitations);
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

    const invitation = await orgService.createInvitation(
      id,
      auth.userId,
      body.email,
      body.role || 'member'
    );

    return apiSuccess(invitation, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
