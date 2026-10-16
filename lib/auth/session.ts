import { cookies, headers } from 'next/headers';

export interface SessionConfig {
  cookieName: string;
  cookieDomain?: string;
  cookieSecure: boolean;
  cookieHttpOnly: boolean;
  cookieSameSite: 'lax' | 'strict' | 'none';
  maxAge: number; // in seconds
}

export function getCookieDomain(): string | undefined {
  const domain = process.env.COOKIE_DOMAIN?.trim();
  return domain && domain.length > 0 ? domain : undefined;
}

export function getCookieSecure(
  requestHeaders?: Headers | { get(name: string): string | null } | null
): boolean {
  // Explicit env override takes highest precedence
  if (process.env.COOKIE_SECURE === 'false') return false;
  if (process.env.COOKIE_SECURE === 'true') return true;

  // Helper to inspect headers
  const checkProto = (h: { get(name: string): string | null }): boolean | null => {
    const proto = h.get('x-forwarded-proto') || h.get('x-forwarded-protocol') || h.get('x-url-scheme');
    if (proto) {
      return proto.split(',')[0].trim().toLowerCase() === 'https';
    }
    const ssl = h.get('x-forwarded-ssl');
    if (ssl) {
      return ssl.trim().toLowerCase() === 'on' || ssl.trim() === '1';
    }
    const referer = h.get('referer');
    if (referer) {
      if (referer.startsWith('https://')) return true;
      if (referer.startsWith('http://')) return false;
    }
    const origin = h.get('origin');
    if (origin) {
      if (origin.startsWith('https://')) return true;
      if (origin.startsWith('http://')) return false;
    }
    return null;
  };

  // 1. Check passed request headers if provided
  if (requestHeaders) {
    const isHttps = checkProto(requestHeaders);
    if (isHttps !== null) return isHttps;
  }

  // 2. Next.js dynamic headers() check if in server request context
  try {
    const h = headers();
    const isHttps = checkProto(h);
    if (isHttps !== null) return isHttps;
  } catch {
    // Gracefully ignore if headers() is called outside server request context (CLI, scripts)
  }

  // 3. Check NEXT_PUBLIC_APP_URL if defined
  if (process.env.NEXT_PUBLIC_APP_URL?.startsWith('http://')) return false;
  if (process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')) return true;

  // 4. Fallback: production default to true, dev default to false
  return process.env.NODE_ENV === 'production';
}

export function getDefaultSessionConfig(
  requestHeaders?: Headers | { get(name: string): string | null } | null
): SessionConfig {
  return {
    cookieName: process.env.COOKIE_NAME || 'innoventix_session',
    cookieDomain: getCookieDomain(),
    cookieSecure: getCookieSecure(requestHeaders),
    cookieHttpOnly: true,
    cookieSameSite: 'lax',
    maxAge: 1800, // Short-lived access token session (30 minutes)
  };
}

export function getRefreshSessionConfig(
  requestHeaders?: Headers | { get(name: string): string | null } | null
): SessionConfig {
  return {
    cookieName: process.env.REFRESH_COOKIE_NAME || 'innoventix_refresh',
    cookieDomain: getCookieDomain(),
    cookieSecure: getCookieSecure(requestHeaders),
    cookieHttpOnly: true,
    cookieSameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // Refresh token lifetime (7 days)
  };
}

/**
 * Set a refresh token in HTTP-only cookie
 */
export async function setRefreshTokenCookie(
  token: string,
  config: Partial<SessionConfig> = {},
  requestHeaders?: Headers | { get(name: string): string | null } | null
): Promise<void> {
  const finalConfig = { ...getRefreshSessionConfig(requestHeaders), ...config };
  try {
    const cookieStore = await cookies();
    cookieStore.set(finalConfig.cookieName, token, {
      httpOnly: finalConfig.cookieHttpOnly,
      secure: finalConfig.cookieSecure,
      sameSite: finalConfig.cookieSameSite,
      maxAge: finalConfig.maxAge,
      domain: finalConfig.cookieDomain,
      path: '/',
    });
  } catch (err) {
    // Gracefully handle contexts where cookies() is not available (CLI, unit tests)
  }
}

/**
 * Get refresh token from cookie
 */
export async function getRefreshTokenFromCookie(
  cookieName: string = process.env.REFRESH_COOKIE_NAME || 'innoventix_refresh'
): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(cookieName)?.value;
  } catch (err) {
    return undefined;
  }
}

/**
 * Delete refresh token cookie
 */
export async function deleteRefreshTokenCookie(
  cookieName: string = process.env.REFRESH_COOKIE_NAME || 'innoventix_refresh'
): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(cookieName);
    cookieStore.delete(process.env.COOKIE_NAME || 'innoventix_session');
  } catch (err) {
    // Gracefully handle contexts where cookies() is not available
  }
}

/**
 * Verify cookie is still valid
 */
export async function isSessionValid(
  cookieName: string = process.env.COOKIE_NAME || 'innoventix_session'
): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    return !!cookieStore.get(cookieName)?.value;
  } catch (err) {
    return false;
  }
}

export interface SessionContext {
  user: {
    id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    email_verified?: boolean;
    email_verified_at?: string | null;
  };
  userId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    plan_tier: string;
    billing_status?: string;
  } | null;
  orgId?: string;
  userOrganizations: UserOrganizationItem[];
  role: string;
  isSuperAdmin: boolean;
  impersonation?: {
    isImpersonated: boolean;
    impersonatedBy?: string;
    impersonatedByEmail?: string;
    impersonatedAs?: string;
    impersonatedOrgId?: string;
    startedAt?: string;
    expiresAt?: string;
  };
}

export interface UserOrganizationItem {
  id: string;
  name: string;
  slug: string;
  role: string;
  is_suspended?: boolean;
  isCurrent?: boolean;
}

export type UserSessionContext = SessionContext;

/**
 * Get current session context (User & Active Organization) for Server Components & Actions
 */
export async function getCurrentSessionContext(): Promise<SessionContext | null> {
  try {
    const cookieStore = await cookies();
    const sessionConfig = getDefaultSessionConfig();
    const token = cookieStore.get(sessionConfig.cookieName)?.value;

    // Check if token exists
    if (!token) {
      // In dev or test mode fallback if user is in headers or mock context
      return null;
    }

    // Dynamic import to prevent circular dependency
    const { verifyAccessToken } = await import('./jwt');
    const { userRepo } = await import('../db/repositories/user-repo');
    const { orgRepo } = await import('../db/repositories/org-repo');

    const accessPayload = verifyAccessToken(token);
    if (!accessPayload?.userId) {
      return null;
    }
    const userId = accessPayload.userId;

    const user = await userRepo.findById(userId);
    if (!user) {
      return null;
    }

    // Check for active Super Admin impersonation origin
    let impersonationContext: {
      isImpersonated: boolean;
      impersonatedBy?: string;
      impersonatedByEmail?: string;
      impersonatedAs?: string;
      impersonatedOrgId?: string;
      startedAt?: string;
      expiresAt?: string;
    } = { isImpersonated: false };

    try {
      const { getImpersonationOriginContext } = await import('./impersonation');
      const origin = await getImpersonationOriginContext();
      if (origin) {
        impersonationContext = {
          isImpersonated: true,
          impersonatedBy: origin.superAdminId,
          impersonatedByEmail: origin.superAdminEmail,
          impersonatedAs: origin.impersonatedUserId,
          impersonatedOrgId: origin.impersonatedOrgId,
          startedAt: origin.startedAt,
          expiresAt: origin.expiresAt,
        };
      }
    } catch {}

    const memberships = await userRepo.getMemberships(userId);
    let organization: any = null;
    let role: string = user.role || 'user';

    const userOrganizations: UserOrganizationItem[] = memberships.map((m, idx) => ({
      id: m.organizationId,
      name: m.organizationName,
      slug: m.organizationSlug,
      role: m.role,
      isCurrent: impersonationContext.isImpersonated
        ? m.organizationId === impersonationContext.impersonatedOrgId
        : idx === 0,
    }));

    // Target organization resolution: scope strictly to impersonatedOrgId if active
    let primary = memberships[0];
    if (impersonationContext.isImpersonated && impersonationContext.impersonatedOrgId) {
      const targetMatch = memberships.find((m) => m.organizationId === impersonationContext.impersonatedOrgId);
      if (targetMatch) {
        primary = targetMatch;
      }
    }

    if (primary) {
      const orgRecord = await orgRepo.findById(primary.organizationId);
      organization = {
        id: primary.organizationId,
        name: primary.organizationName,
        slug: primary.organizationSlug,
        logo_url: orgRecord?.logo_url || null,
        plan_tier: (orgRecord as any)?.plan_tier || 'free',
        billing_status: (orgRecord as any)?.billing_status || 'active',
      };
      role = primary.role || role;
    } else if (impersonationContext.isImpersonated && impersonationContext.impersonatedOrgId) {
      // User may be impersonated directly in org context where memberships row is pending or direct
      const directOrg = await orgRepo.findById(impersonationContext.impersonatedOrgId);
      if (directOrg) {
        organization = {
          id: directOrg.id,
          name: directOrg.name,
          slug: directOrg.slug,
          logo_url: directOrg.logo_url || null,
          plan_tier: (directOrg as any)?.plan_tier || 'free',
          billing_status: (directOrg as any)?.billing_status || 'active',
        };
      }
    }

    let isSuperAdminUser: boolean = false;
    // When impersonating, caller operates under target user's role and tenant scope
    if (!impersonationContext.isImpersonated) {
      isSuperAdminUser = user.role === 'super_admin';
      if (!isSuperAdminUser) {
        try {
          const { queryOne: dbQueryOne } = await import('../db');
          const saRecord = await dbQueryOne<{ id: string }>(
            'SELECT id FROM super_admins WHERE user_id = $1',
            [user.id]
          );
          if (saRecord) {
            isSuperAdminUser = true;
          }
        } catch {
          // Ignore if query fails
        }
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        email_verified: (user as any).email_verified ?? !!(user as any).email_verified_at,
        email_verified_at: (user as any).email_verified_at ? String((user as any).email_verified_at) : null,
      },
      userId: user.id,
      organization,
      orgId: organization?.id,
      userOrganizations,
      role: isSuperAdminUser && role !== 'owner' ? 'owner' : role,
      isSuperAdmin: isSuperAdminUser,
      impersonation: impersonationContext,
    };
  } catch (error) {
    return null;
  }
}

