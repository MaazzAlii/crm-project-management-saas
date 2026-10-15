import { NextRequest } from 'next/server';
import { getAuthFromRequest, getTenantOrgId } from '@/lib/auth/middleware';
import { communicationService } from '@/lib/services/communication-service';
import { transaction } from '@/lib/db';
import { checkChannelLimit, checkFeatureAccess } from '@/lib/services/plan-limits';
import { apiSuccess, handleApiError, apiError, apiPlanLimitError } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const tenant = getTenantOrgId(request, auth);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    const channels = await communicationService.getChannels(orgId);
    return apiSuccess(channels);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const body = await request.json();
    const tenant = getTenantOrgId(request, auth, body);
    if ('error' in tenant) {
      return apiError(tenant.error, tenant.status as any, tenant.status === 404 ? 'NOT_FOUND' : 'UNAUTHORIZED');
    }
    const orgId = tenant.orgId;

    if (!body.provider || !body.externalAccountId) {
      return apiError('provider and externalAccountId are required', 400, 'VALIDATION_ERROR');
    }

    // Atomic plan quota enforcement with row lock to eliminate race conditions
    const result = await transaction(async (client) => {
      await client.query('SELECT id FROM organizations WHERE id = $1 FOR UPDATE', [orgId]);

      // If channel already exists, allow idempotent update without consuming another slot
      const existing = await client.query(
        'SELECT id FROM communication_channels WHERE organization_id = $1 AND provider = $2 AND external_account_id = $3',
        [orgId, body.provider, body.externalAccountId]
      );

      if (existing.rows.length === 0) {
        if (body.provider === 'email') {
          const featureCheck = await checkFeatureAccess(orgId, 'emailIntegration', { client });
          if (!featureCheck.allowed) {
            return { featureError: featureCheck };
          }
        }

        const limitCheck = await checkChannelLimit(orgId, { client });
        if (!limitCheck.allowed) {
          return { limitError: limitCheck };
        }
      }

      const channel = await communicationService.configureChannel(orgId, auth!.userId, body, { client });
      return { channel };
    });

    if ('featureError' in result) {
      return apiPlanLimitError(result.featureError, 'UPGRADE_REQUIRED');
    }

    if ('limitError' in result) {
      return apiPlanLimitError(result.limitError, 'CHANNEL_LIMIT_REACHED');
    }

    return apiSuccess(result.channel, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

