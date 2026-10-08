'use server'

import crypto from 'crypto'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { setRefreshTokenCookie } from '@/lib/auth/session'
import { userRepo } from '@/lib/db/repositories/user-repo'
import { orgRepo } from '@/lib/db/repositories/org-repo'
import { query } from '@/lib/db'
import { ensureAutoMigrated } from '@/lib/db/auto-migrate'

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

  const passwordValidation = validatePasswordStrength(password)
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.errors.join('. ') }
  }

  try {
    await ensureAutoMigrated()

    const cleanEmail = email.toLowerCase().trim()
    const existing = await userRepo.findByEmail(cleanEmail)
    if (existing) {
      return { error: 'User with this email already exists.' }
    }

    // 1. Hash password & create user
    const passwordHash = await hashPassword(password)
    const user = await userRepo.create({
      email: cleanEmail,
      passwordHash,
      fullName: fullName.trim(),
      role: 'user',
    })

    // 2. Create organization and assign user as owner
    const slugBase =
      orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'my-workspace'
    const uniqueSlug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`

    await orgRepo.create({
      name: orgName.trim(),
      slug: uniqueSlug,
      ownerUserId: user.id,
    })

    // 3. Issue JWT & Session Cookie
    const tokenFamily = crypto.randomUUID()
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenFamily,
      email: user.email,
      role: user.role,
    })

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex')

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, token_family, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [user.id, refreshTokenHash, tokenFamily]
    )

    await setRefreshTokenCookie(refreshToken)

    return { success: true, redirectUrl: '/onboarding' }
  } catch (err: any) {
    console.error('[SIGNUP_ACTION_EXCEPTION]', err)
    return { error: err.message || 'An unexpected error occurred during signup.' }
  }
}
