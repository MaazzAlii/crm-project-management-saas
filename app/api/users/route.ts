import { NextRequest } from 'next/server';
import { getAuthFromRequest, withRole } from '@/lib/auth/middleware';
import { userService } from '@/lib/services/user-service';
import { apiSuccess, apiPaginated, handleApiError, apiError, extractPagination } from '@/lib/utils/response';

import { query, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = request.nextUrl;
    const pagination = extractPagination(searchParams);
    const search = searchParams.get('search') || undefined;

    // Super admin with no orgId can list across all tenants
    if (auth.role === 'super_admin' && !auth.orgId) {
      const result = await userService.listUsers({ ...pagination, search });
      return apiPaginated(result.users, result.total, pagination.page, pagination.limit);
    }

    const orgId = auth.orgId;
    if (!orgId) {
      return apiError('Organization context required', 400, 'BAD_REQUEST');
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const offset = (page - 1) * limit;

    let usersSql = `
      SELECT u.id, u.email, u.full_name, u.avatar_url, u.role, u.is_active, u.created_at, om.role as org_role
      FROM users u
      JOIN organization_members om ON om.user_id = u.id
      WHERE om.organization_id = $1 AND u.is_active = true
    `;
    let countSql = `
      SELECT COUNT(*) as count
      FROM users u
      JOIN organization_members om ON om.user_id = u.id
      WHERE om.organization_id = $1 AND u.is_active = true
    `;
    const params: any[] = [orgId];

    if (search) {
      params.push(`%${search}%`);
      usersSql += ` AND (u.email ILIKE $2 OR u.full_name ILIKE $2)`;
      countSql += ` AND (u.email ILIKE $2 OR u.full_name ILIKE $2)`;
    }

    usersSql += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];

    const [usersRes, countRes] = await Promise.all([
      query<any>(usersSql, queryParams),
      queryOne<{ count: string }>(countSql, params),
    ]);

    const total = parseInt(countRes?.count || '0', 10);
    return apiPaginated(usersRes.rows, total, page, limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || (auth.role !== 'super_admin' && auth.role !== 'org_admin')) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    if (!body.email || !body.password) {
      return apiError('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    const user = await userService.adminCreateUser({
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      role: body.role,
    });

    return apiSuccess(user, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
