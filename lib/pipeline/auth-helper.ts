import { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/auth/jwt';
import { userRepo } from '@/lib/db/repositories/user-repo';
import { orgRepo } from '@/lib/db/repositories/org-repo';
import { SessionContext, getDefaultSessionConfig } from '@/lib/auth/session';

export async function getPipelineSession(request: NextRequest): Promise<SessionContext | null> {
  let userId: string | null = null;
  let tokenOrgId: string | undefined = undefined;

  // 1. Check Authorization Bearer header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (payload?.userId) {
      userId = payload.userId;
      tokenOrgId = payload.orgId;
    }
  }

  // 2. Fallback to session cookie
  if (!userId) {
    const config = getDefaultSessionConfig(request.headers);
    const cookieToken = request.cookies.get(config.cookieName)?.value;
    if (cookieToken) {
      const accessPayload = verifyAccessToken(cookieToken);
      if (accessPayload?.userId) {
        userId = accessPayload.userId;
        tokenOrgId = accessPayload.orgId;
      } else {
        const refreshPayload = verifyRefreshToken(cookieToken);
        if (refreshPayload?.userId) {
          userId = refreshPayload.userId;
          tokenOrgId = (refreshPayload as any)?.orgId;
        }
      }
    }
  }

  if (!userId) {
    return null;
  }

  const user = await userRepo.findById(userId);
  if (!user || !user.is_active) {
    return null;
  }

  const memberships = await userRepo.getMemberships(userId);
  let activeOrgId = tokenOrgId || (memberships.length > 0 ? memberships[0].organizationId : undefined);

  // If x-organization-id header is sent and user is a member or super admin, switch context
  const requestedOrgId = request.headers.get('x-organization-id');
  if (requestedOrgId) {
    const isMemberOfRequested = memberships.some((m) => m.organizationId === requestedOrgId);
    if (isMemberOfRequested || user.role === 'super_admin') {
      activeOrgId = requestedOrgId;
    }
  }

  let organization: any = null;
  let role: string = user.role || 'user';

  const userOrganizations = memberships.map((m) => ({
    id: m.organizationId,
    name: m.organizationName,
    slug: m.organizationSlug,
    role: m.role,
    isCurrent: m.organizationId === activeOrgId,
  }));

  if (activeOrgId) {
    const orgRecord = await orgRepo.findById(activeOrgId);
    if (orgRecord) {
      const memberInfo = memberships.find((m) => m.organizationId === activeOrgId);
      organization = {
        id: orgRecord.id,
        name: orgRecord.name,
        slug: orgRecord.slug,
        logo_url: orgRecord.logo_url || null,
        plan_tier: (orgRecord as any).plan_tier || 'free',
        billing_status: (orgRecord as any).billing_status || 'active',
      };
      role = memberInfo?.role || (user.role === 'super_admin' ? 'owner' : user.role);
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
    },
    userId: user.id,
    organization,
    orgId: activeOrgId,
    userOrganizations,
    role,
    isSuperAdmin: user.role === 'super_admin',
  };
}
