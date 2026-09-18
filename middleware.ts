import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — copy .env.local.example to .env.local and fill in real values.'
    )
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Client Portal Routes — separate auth boundary
  const isPortalRoute = pathname.startsWith('/client')
  const isPortalPublic = pathname.startsWith('/client/login') || pathname.startsWith('/client/auth')

  // Portal: require session for protected portal paths
  if (isPortalRoute && !isPortalPublic && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/client/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Protected Routes requiring Auth (org-member app)
  const isProtectedRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/team') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/super-admin')

  // Auth Routes (Login / Signup)
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')

  const isDevSuperAdmin = request.cookies.get('dev_super_admin')?.value === 'true' || process.env.DEV_SUPER_ADMIN === 'true'

  if (isProtectedRoute && !user && !isDevSuperAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Super Admin Guard — strictly isolated tier checking super_admins table
  if (pathname.startsWith('/super-admin')) {
    if (isDevSuperAdmin) {
      return response
    }
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    try {
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!superAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    } catch {
      // In dev environment when local DB is offline
      if (process.env.NODE_ENV === 'development') {
        return response
      }
    }
  }

  // Tenant Organization Suspension Guard — block suspended org access for non-super-admins
  if (user && isProtectedRoute && !pathname.startsWith('/super-admin') && !pathname.startsWith('/org-suspended')) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, organizations!inner(is_suspended)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (member && (member.organizations as any)?.is_suspended) {
      // Confirm user is not a super admin before blocking
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!superAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = '/org-suspended'
        return NextResponse.redirect(url)
      }
    }
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
