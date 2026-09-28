import { cookies } from 'next/headers';

export interface SessionConfig {
  cookieName: string;
  cookieDomain?: string;
  cookieSecure: boolean;
  cookieHttpOnly: boolean;
  cookieSameSite: 'lax' | 'strict' | 'none';
  maxAge: number; // in seconds
}

const defaultConfig: SessionConfig = {
  cookieName: process.env.COOKIE_NAME || 'innoventix_session',
  cookieDomain: process.env.COOKIE_DOMAIN,
  cookieSecure: process.env.NODE_ENV === 'production',
  cookieHttpOnly: true,
  cookieSameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

/**
 * Set a refresh token in HTTP-only cookie
 */
export async function setRefreshTokenCookie(
  token: string,
  config: Partial<SessionConfig> = {}
): Promise<void> {
  const finalConfig = { ...defaultConfig, ...config };
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
  cookieName: string = process.env.COOKIE_NAME || 'innoventix_session'
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
  cookieName: string = process.env.COOKIE_NAME || 'innoventix_session'
): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(cookieName);
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
  const token = await getRefreshTokenFromCookie(cookieName);
  return !!token;
}

export interface SessionContext {
  user: {
    id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
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
    const token = cookieStore.get(defaultConfig.cookieName)?.value;

    // Check if token exists
    if (!token) {
      // In dev or test mode fallback if user is in headers or mock context
      return null;
    }

    // Dynamic import to prevent circular dependency
    const { verifyAccessToken, verifyRefreshToken } = await import('./jwt');
    const { userRepo } = await import('../db/repositories/user-repo');
    const { orgRepo } = await import('../db/repositories/org-repo');

    let userId: string | null = null;
    const accessPayload = verifyAccessToken(token);
    if (accessPayload?.userId) {
      userId = accessPayload.userId;
    } else {
      const refreshPayload = verifyRefreshToken(token);
      if (refreshPayload?.userId) {
        userId = refreshPayload.userId;
      }
    }

    if (!userId) {
      return null;
    }

    const user = await userRepo.findById(userId);
    if (!user) {
      return null;
    }

    const memberships = await userRepo.getMemberships(userId);
    let organization: any = null;
    let role: string = user.role || 'user';


    const userOrganizations: UserOrganizationItem[] = memberships.map((m, idx) => ({
      id: m.organizationId,
      name: m.organizationName,
      slug: m.organizationSlug,
      role: m.role,
      isCurrent: idx === 0,
    }));

    if (memberships.length > 0) {
      const primary = memberships[0];
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
      orgId: organization?.id,
      userOrganizations,
      role,
      isSuperAdmin: user.role === 'super_admin',
    };



  } catch (error) {
    return null;
  }
}

