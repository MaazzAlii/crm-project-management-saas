import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { orgRepo } from '@/lib/db/repositories/org-repo';
import { domainVerificationRepo } from '@/lib/db/repositories/domain-verification-repo';
import { hashToken } from '@/lib/security/invite-token';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/response';

/**
 * POST /api/organizations/domain/confirm
 * Owner only.
 * Validates domain verification code/link, checks user identity, enforces one-time usage and expiry.
 * Updates organizations.verified_domain and organizations.domain_verified_at.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !auth.userId) {
      return apiError('Unauthorized: Authentication required', 401, 'UNAUTHORIZED');
    }

    const orgId = auth.orgId;
    if (!orgId) {
      return apiError('Active organization context required', 400, 'ORG_ID_REQUIRED');
    }

    // Role verification: Owner only
    const role = await orgRepo.getMemberRole(orgId, auth.userId);
    if (role !== 'owner') {
      return apiError('Only organization owners can confirm business domain verification', 403, 'FORBIDDEN');
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return apiError('Invalid request body', 400, 'INVALID_BODY');
    }

    const { domain, code, token } = body;
    if (!domain || typeof domain !== 'string' || !domain.trim()) {
      return apiError('Domain name is required', 400, 'DOMAIN_REQUIRED');
    }

    const secret = code || token;
    if (!secret || typeof secret !== 'string' || !secret.trim()) {
      return apiError('Verification code or link token is required', 400, 'CODE_REQUIRED');
    }

    const normalizedDomain = domain.toLowerCase().trim();
    const hash = hashToken(secret.trim());

    const verification = await domainVerificationRepo.findByCodeOrTokenHash(
      orgId,
      normalizedDomain,
      hash
    );

    if (!verification) {
      return apiError('Invalid domain verification code or link', 400, 'INVALID_CODE');
    }

    // Security invariant: Code cannot be used by a different user
    if (verification.user_id !== auth.userId) {
      return apiError(
        'Verification code was issued for a different user and cannot be claimed',
        403,
        'FORBIDDEN'
      );
    }

    if (verification.consumed_at) {
      return apiError('Verification code has already been used', 400, 'CODE_ALREADY_USED');
    }

    if (new Date(verification.expires_at) < new Date()) {
      return apiError('Verification code has expired', 400, 'CODE_EXPIRED');
    }

    // Atomically consume code
    const consumed = await domainVerificationRepo.consume(verification.id);
    if (!consumed) {
      return apiError('Verification code has already been used', 400, 'CODE_ALREADY_USED');
    }

    // Mark domain as verified on organization
    const updatedOrg = await orgRepo.setVerifiedDomain(orgId, auth.userId, verification.domain);

    return apiSuccess({
      success: true,
      verifiedDomain: updatedOrg.verified_domain,
      domainVerifiedAt: updatedOrg.domain_verified_at,
      message: `Domain ${verification.domain} successfully verified`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
