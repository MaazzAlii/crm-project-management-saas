import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth/middleware';
import { orgRepo } from '@/lib/db/repositories/org-repo';
import { domainVerificationRepo } from '@/lib/db/repositories/domain-verification-repo';
import { getCurrentPlan } from '@/lib/billing/current-plan';
import { generateToken, hashToken } from '@/lib/security/invite-token';
import { isValidEmail } from '@/lib/validation/email';
import { apiSuccess, apiError, handleApiError } from '@/lib/utils/response';

/**
 * POST /api/organizations/domain/send-code
 * Owner only.
 * Validates plan (Pro/Enterprise required) and matching domain email.
 * Stores hashed verification link token and 6-digit verification code.
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
      return apiError('Only organization owners can initiate business domain verification', 403, 'FORBIDDEN');
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return apiError('Invalid request body', 400, 'INVALID_BODY');
    }

    // Plan tier verification: Pro / Enterprise only (Prompt 22 & Plan Rules)
    const planInfo = await getCurrentPlan(orgId);
    if (planInfo.planId === 'free') {
      return apiError(
        'Domain verification requires an active Pro or Enterprise subscription. Please upgrade your plan.',
        403,
        'UPGRADE_REQUIRED'
      );
    }

    const { domain, targetEmail } = body;
    if (!domain || typeof domain !== 'string' || !domain.trim()) {
      return apiError('Domain name is required', 400, 'DOMAIN_REQUIRED');
    }
    if (!targetEmail || typeof targetEmail !== 'string' || !isValidEmail(targetEmail.trim())) {
      return apiError('A valid target email address is required', 400, 'INVALID_EMAIL');
    }

    const normalizedDomain = domain.toLowerCase().trim();
    const normalizedEmail = targetEmail.toLowerCase().trim();
    const emailParts = normalizedEmail.split('@');
    const emailDomain = emailParts[1];

    if (emailDomain !== normalizedDomain) {
      return apiError(
        `Target email (${normalizedEmail}) must belong to the claimed domain (@${normalizedDomain})`,
        400,
        'DOMAIN_MISMATCH'
      );
    }

    // Invalidate older pending codes for this org + domain
    await domainVerificationRepo.invalidateOlder(orgId, normalizedDomain);

    // Generate 6-digit code and secure link token
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = hashToken(rawCode);
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await domainVerificationRepo.insertVerification(
      orgId,
      auth.userId,
      normalizedDomain,
      normalizedEmail,
      tokenHash,
      codeHash,
      expiresAt
    );

    console.log(`[DOMAIN_CODE_SENT] Org: ${orgId}, Domain: ${normalizedDomain}, Target: ${normalizedEmail}`);

    return apiSuccess({
      success: true,
      message: 'Domain verification code and link sent successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
