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

    // Membership check: only members or super_admins can view organization details
    if (auth.role !== 'super_admin') {
      const membership = await queryOne(
        `SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
        [id, auth.userId]
      );
      if (!membership) {
        return apiError('Organization not found', 404, 'NOT_FOUND');
      }
    }

    const org = await orgService.getOrganization(id);
    return apiSuccess(org);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
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
    const updated = await orgService.updateOrganization(id, auth.userId, {
      name: body.name,
      logoUrl: body.logoUrl,
    });

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
    await orgService.deleteOrganization(id, auth.userId);
    return apiSuccess({ deleted: true, organizationId: id });
  } catch (error) {
    return handleApiError(error);
  }
}
