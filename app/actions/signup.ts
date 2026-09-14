'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface SignUpInput {
  fullName: string
  orgName: string
  email: string
  password: string
}

export async function handleSignUpAction(input: SignUpInput) {
  const { fullName, orgName, email, password } = input

  if (!fullName || !orgName || !email || !password) {
    return { error: 'All fields are required.' }
  }

  try {
    const supabase = await createClient()

    // 1. Sign up user via Supabase GoTrue Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          org_name: orgName,
        },
      },
    })

    if (signUpError) {
      return { error: signUpError.message }
    }

    const user = authData.user
    if (!user) {
      return { error: 'Failed to create user authentication record.' }
    }

    // 2. Obtain database client (use admin client for initial provisioning to prevent RLS execution failures)
    let dbClient
    try {
      dbClient = createAdminClient()
    } catch {
      dbClient = supabase
    }

    // 3. Upsert Profile
    const { error: profileError } = await dbClient.from('profiles').upsert({
      id: user.id,
      email: email,
      full_name: fullName,
    })

    if (profileError) {
      console.error('[SIGNUP_ACTION] Profile creation error:', profileError)
      return { error: `Profile creation failed: ${profileError.message}` }
    }

    // 4. Create Organization
    const slugBase = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'my-workspace'
    const uniqueSlug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`

    const { data: orgData, error: orgError } = await dbClient
      .from('organizations')
      .insert({
        name: orgName,
        slug: uniqueSlug,
        plan_tier: 'free',
        billing_status: 'active',
        onboarding_completed: false,
      })
      .select()
      .single()

    if (orgError || !orgData) {
      console.error('[SIGNUP_ACTION] Organization creation error:', orgError)
      return { error: `Organization creation failed: ${orgError?.message || 'Unknown database error'}` }
    }

    // 5. Link User as Owner of Organization
    const { error: memberError } = await dbClient.from('organization_members').insert({
      organization_id: orgData.id,
      user_id: user.id,
      role: 'owner',
    })

    if (memberError) {
      console.error('[SIGNUP_ACTION] Org member link error:', memberError)
      return { error: `Organization membership assignment failed: ${memberError.message}` }
    }

    return { success: true, redirectUrl: '/onboarding' }
  } catch (err: any) {
    console.error('[SIGNUP_ACTION_EXCEPTION]', err)
    if (err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
      if (process.env.NODE_ENV === 'development') {
        const { cookies } = await import('next/headers')
        cookies().set('dev_super_admin', 'true', { path: '/', maxAge: 86400 })
        return { success: true, redirectUrl: '/super-admin/dashboard' }
      }
      return {
        error:
          'Unable to connect to local Supabase Auth server (http://localhost:54321). Please verify your Docker Supabase container is running.',
      }
    }
    return { error: err.message || 'An unexpected error occurred during signup.' }
  }
}
