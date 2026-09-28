import { NextResponse } from 'next/server';
import { AppError } from './error-handler';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: Record<string, any>;
}

/**
 * Return a successful JSON API response
 */
export function apiSuccess<T>(data: T, status: number = 200, meta?: Record<string, any>): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status }
  );
}

/**
 * Return a paginated JSON API response
 */
export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  status: number = 200
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(total / (limit || 1));
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    },
    { status }
  );
}

/**
 * Return an error JSON API response
 */
export function apiError(
  message: string,
  status: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: any
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status }
  );
}

/**
 * Extract standard pagination parameters from URL search params
 */
export function extractPagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  offset: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;
  const orderBy = searchParams.get('orderBy') || searchParams.get('sortBy') || undefined;
  const orderDirection = searchParams.get('orderDirection')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return { page, limit, offset, orderBy, orderDirection };
}

/**
 * Centralized API error catcher
 */
export function handleApiError(error: any): NextResponse<ApiResponse<null>> {
  if (error instanceof AppError) {
    return apiError(error.message, error.statusCode, error.code, error.details);
  }

  console.error('[Unhandled API Error]:', error);
  return apiError(
    process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Unknown error occurred',
    500,
    'INTERNAL_SERVER_ERROR'
  );
}


