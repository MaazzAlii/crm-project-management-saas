import { NextResponse } from 'next/server';
import { ServiceError } from './deal-service';

export function jsonOk<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonError(
  code: string,
  message: string,
  status: number = 400,
  extra: Record<string, any> = {}
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...extra,
      },
    },
    { status }
  );
}

export function handleServiceError(error: ServiceError) {
  switch (error.code) {
    case 'UNAUTHORIZED':
      return jsonError('UNAUTHORIZED', error.message, 401);
    case 'FORBIDDEN':
      return jsonError('FORBIDDEN', error.message, 403);
    case 'NOT_FOUND':
      return jsonError('NOT_FOUND', error.message, 404);
    case 'VERSION_CONFLICT':
      return jsonError('VERSION_CONFLICT', error.message, 409, {
        currentDeal: error.currentDeal,
      });
    case 'WIP_LIMIT':
      return jsonError('WIP_LIMIT', error.message, 422, {
        stageName: error.stageName,
        limit: error.limit,
      });
    case 'LOST_REASON_REQUIRED':
      return jsonError('LOST_REASON_REQUIRED', error.message, 422);
    case 'BAD_REQUEST':
    default:
      return jsonError('BAD_REQUEST', error.message, 400);
  }
}
