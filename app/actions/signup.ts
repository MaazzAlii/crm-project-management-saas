'use server'

import crypto from 'crypto'
import { hashPassword, validatePasswordStrength, calculatePasswordStrength } from '@/lib/auth/password'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { setRefreshTokenCookie } from '@/lib/auth/session'
import { userRepo } from '@/lib/db/repositories/user-repo'
import { orgRepo } from '@/lib/db/repositories/org-repo'
import { query } from '@/lib/db'
import { ensureAutoMigrated } from '@/lib/db/auto-migrate'

export interface SignUpFieldError {
  code: 'VALIDATION_ERROR' | 'EMAIL_ALREADY_EXISTS' | 'INTERNAL_ERROR'
  field?: 'fullName' | 'orgName' | 'email' | 'password'
  message: string
}

export interface SignUpActionResult {
  success?: boolean
  redirectUrl?: string
  error?: string
  errorDetail?: SignUpFieldError
}

export interface SignUpInput {
  fullName: string
  orgName: string
  email: string
  password: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function handleSignUpAction(input: SignUpInput): Promise<SignUpActionResult> {
  const { fullName, orgName, email, password } = input

  if (!fullName || !fullName.trim()) {
    return {
      success: false,
      error: 'Full name is required.',
      errorDetail: {
        code: 'VALIDATION_ERROR',
        field: 'fullName',
        message: 'Full name is required.',
      },
    }
  }

  if (!orgName || !orgName.trim()) {
    return {
      success: false,
      error: 'Company / Organization name is required.',
      errorDetail: {
        code: 'VALIDATION_ERROR',
        field: 'orgName',
        message: 'Company / Organization name is required.',
      },
    }
  }

  if (!email || !email.trim()) {
    return {
      success: false,
      error: 'Email address is required.',
      errorDetail: {
        code: 'VALIDATION_ERROR',
        field: 'email',
        message: 'Email address is required.',
      },
    }
  }

  const cleanEmail = email.toLowerCase().trim()
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return {
      success: false,
      error: 'Please enter a valid email address.',
      errorDetail: {
        code: 'VALIDATION_ERROR',
        field: 'email',
        message: 'Please enter a valid email address.',
      },
    }
  }

  if (!password) {
    return {
      success: false,
      error: 'Password is required.',
      errorDetail: {
        code: 'VALIDATION_ERROR',
        field: 'password',
        message: 'Password is required.',
      },
    }
  }

  const passwordValidation = validatePasswordStrength(password)
  const passwordStrength = calculatePasswordStrength(password)
  if (!passwordValidation.isValid || passwordStrength.score < 3) {
    const errorMsg =
      passwordValidation.errors.length > 0
        ? passwordValidation.errors.join('. ')
        : 'Password is too weak. Please choose a stronger password (must meet at least 3 criteria).'
    return {
      success: false,
      error: errorMsg,
      errorDetail: {
        code: 'VALIDATION_ERROR',
        field: 'password',
        message: errorMsg,
      },
    }
  }

  try {
    await ensureAutoMigrated()

    const existing = await userRepo.findByEmail(cleanEmail)
    if (existing) {
      return {
        success: false,
        error: 'An account with this email already exists.',
        errorDetail: {
          code: 'EMAIL_ALREADY_EXISTS',
          field: 'email',
          message: 'An account with this email already exists.',
        },
      }
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

    // 4. Trigger email verification token creation & send (graceful failure)
    try {
      const { emailVerificationRepo } = await import('@/lib/db/repositories/email-verification-repo')
      const { generateToken, hashToken } = await import('@/lib/security/invite-token')
      const { sendEmail } = await import('@/lib/email/sender')
      const { renderVerifyEmail } = await import('@/lib/email/templates')

      const verifyToken = generateToken()
      const verifyTokenHash = hashToken(verifyToken)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await emailVerificationRepo.insertVerification(user.id, user.email, verifyTokenHash, expiresAt)

      const emailContent = renderVerifyEmail({
        rawToken: verifyToken,
        userEmail: user.email,
        userName: user.full_name || undefined,
      })

      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      })
    } catch (e) {
      console.warn('[SIGNUP_VERIFICATION_EMAIL_SEND_FAILED]', e)
    }

    return { success: true, redirectUrl: '/onboarding' }
  } catch (err: any) {
    console.error('[SIGNUP_ACTION_EXCEPTION]', err)
    return {
      success: false,
      error: err.message || 'An unexpected error occurred during signup.',
      errorDetail: {
        code: 'INTERNAL_ERROR',
        message: err.message || 'An unexpected error occurred during signup.',
      },
    }
  }
}

export interface SignUpWithInviteInput {
  fullName: string
  password: string
  inviteToken: string
}

/**
 * Prompt 38: Signup with an invitation
 * - Creates user account locked to the invitation's email.
 * - Does NOT create a new workspace/organization.
 * - Accepts invitation and joins existing organization immediately.
 * - Dispatches verification email and returns redirectUrl to /dashboard.
 */
export async function handleSignUpWithInviteAction(input: SignUpWithInviteInput): Promise<SignUpActionResult> {
  const { fullName, password, inviteToken } = input

  if (!fullName || !fullName.trim()) {
    return {
      success: false,
      error: 'Full name is required.',
      errorDetail: {
        code: 'VALIDATION_ERROR',
        field: 'fullName',
        message: 'Full name is required.',
      },
    }
  }

  if (!password) {
    return {
      success: false,
      error: 'Password is required.',
      errorDetail: {
        code: 'VALIDATION_ERROR',
        field: 'password',
        message: 'Password is required.',
      },
    }
  }

  if (!inviteToken) {
    return {
      success: false,
      error: 'Invite token is required.',
      errorDetail: {
        code: 'VALIDATION_ERROR',
        message: 'Invite token is required.',
      },
    }
  }

  const passwordValidation = validatePasswordStrength(password)
  const passwordStrength = calculatePasswordStrength(password)
  if (!passwordValidation.isValid || passwordStrength.score < 3) {
    const errorMsg =
      passwordValidation.errors.length > 0
        ? passwordValidation.errors.join('. ')
        : 'Password is too weak. Please choose a stronger password (must meet at least 3 criteria).'
    return {
      success: false,
      error: errorMsg,
      errorDetail: {
        code: 'VALIDATION_ERROR',
        field: 'password',
        message: errorMsg,
      },
    }
  }

  try {
    await ensureAutoMigrated()

    const { getInvitationAcceptInfo, acceptInvitation } = await import('@/lib/services/invitation-service')
    const { hashToken, generateToken } = await import('@/lib/security/invite-token')
    const { invitationRepo } = await import('@/lib/db/repositories/invitation-repo')
    const { emailVerificationRepo } = await import('@/lib/db/repositories/email-verification-repo')
    const { sendEmail } = await import('@/lib/email/sender')
    const { renderVerifyEmail } = await import('@/lib/email/templates')

    // 1. Verify invitation token validity
    const acceptInfo = await getInvitationAcceptInfo(inviteToken)
    if (!acceptInfo.success) {
      return { error: 'This invitation is invalid or has expired.' }
    }

    const tokenHash = hashToken(inviteToken)
    const invitation = await invitationRepo.findByTokenHash(tokenHash)
    if (!invitation || invitation.status !== 'pending') {
      return { error: 'This invitation is invalid or has expired.' }
    }

    const cleanEmail = invitation.email.toLowerCase().trim()
    const existing = await userRepo.findByEmail(cleanEmail)
    if (existing) {
      return { error: 'An account with this email already exists. Please sign in instead.' }
    }

    // 2. Create user (unverified initially until confirmed)
    const passwordHash = await hashPassword(password)
    const user = await userRepo.create({
      email: cleanEmail,
      passwordHash,
      fullName: fullName.trim(),
      role: 'user',
    })

    // 3. Issue Session Tokens and Cookie
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

    // 4. Accept the invitation directly for the newly created user
    const acceptRes = await acceptInvitation(inviteToken, {
      userId: user.id,
      email: user.email,
    })

    if (!acceptRes.success) {
      return { error: acceptRes.message || 'Failed to accept invitation.' }
    }

    // 5. Send verification email in the background
    try {
      const verifyToken = generateToken()
      const verifyTokenHash = hashToken(verifyToken)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await emailVerificationRepo.insertVerification(user.id, user.email, verifyTokenHash, expiresAt)

      const emailContent = renderVerifyEmail({
        rawToken: verifyToken,
        userEmail: user.email,
        userName: user.full_name || undefined,
      })

      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      })
    } catch (e) {
      console.warn('Failed to dispatch background verification email on invite signup:', e)
    }

    return { success: true, redirectUrl: '/dashboard' }
  } catch (err: any) {
    console.error('[SIGNUP_WITH_INVITE_EXCEPTION]', err)
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

