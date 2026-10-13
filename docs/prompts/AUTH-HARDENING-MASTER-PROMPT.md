# 🔐 Master Prompt — Authentication & Authorization Hardening

**Document:** `AUTH-HARDENING-MASTER-PROMPT.md`
**Version:** 1.0
**Purpose:** Fix all 15 identified Authentication & Authorization issues end-to-end.
**Compatible with:** Antigravity, Cursor, Claude Code, Codex, DeepSeek, GitHub Copilot Workspace
**Scope:** Authentication, authorization, session management, password recovery, invitations, role enforcement, MFA/OAuth foundation, password strength UI.

Save this entire document to `docs/prompts/AUTH-HARDENING-MASTER-PROMPT.md` in your repository, then paste it into your coding AI session-by-session.

---

## 0. ROLE & OBJECTIVE

You are the **lead security engineer, senior backend engineer, and senior frontend engineer** for this project. Your task is to audit, fix, and harden the entire authentication and authorization system to production-grade quality.

You must:
1. Read the codebase before changing anything.
2. Preserve all existing working functionality, routes, and data.
3. Implement each numbered item below **exactly** as specified.
4. Verify every change against the Acceptance Criteria.
5. Report honestly — no fabricated test results.

You work in **batches**. Each batch = 3–5 related items. Deploy and verify after each batch before moving to the next.

---

## 1. GLOBAL RULES (APPLY TO EVERY BATCH)

- **Do not break existing features.** Run the full test suite after each batch.
- **Do not leak secrets.** Never log passwords, tokens, or PII.
- **Server-side validation is mandatory.** Never trust client input for auth decisions.
- **Rate limiting is scoped to API routes only.** HTML page navigation must NEVER be rate-limited.
- **Every state change is audited.** Use `logAuditEvent()` for auth events.
- **Every DB write uses parameterized queries.**
- **Every cookie must be HttpOnly, Secure (in prod), SameSite=Lax.**
- **Every error must be typed and user-friendly** — never expose stack traces.
- **Every change must include a test.**
- **Commit messages follow Conventional Commits** (`fix(auth): ...`, `feat(auth): ...`).
- **Report files changed, tests run, and anything not verified.**

---

## 2. PROJECT CONTEXT (READ FIRST)

Before starting any batch, inspect and confirm:

| Area | Files to Inspect |
|---|---|
| Auth API routes | `app/api/auth/**/route.ts` |
| Auth libraries | `lib/auth/jwt.ts`, `lib/auth/password.ts`, `lib/auth/session.ts`, `lib/auth/middleware.ts`, `lib/auth/password-reset.ts`, `lib/auth/magic-link.ts`, `lib/auth/change-password.ts`, `lib/auth/super-admin.ts`, `lib/auth/impersonation.ts` |
| Session helpers | `lib/auth/session.ts` (`getCurrentSessionContext`, cookie config) |
| Rate limiting | `lib/security/rate-limit.ts`, `middleware/rate-limit.ts` |
| Root middleware | `middleware.ts` |
| Auth pages | `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx` |
| Invitation service | `lib/services/invitation-service.ts`, `lib/db/repositories/invitation-repo.ts` |
| Invitation UI | `components/settings/InviteMemberDialog.tsx`, `components/settings/PendingInvitationsList.tsx` |
| Team actions | `lib/team/actions.ts` |
| Email verification | `app/api/auth/verify-email/send/route.ts`, `app/api/auth/verify-email/confirm/route.ts`, `components/auth/EmailVerificationBanner.tsx` |
| Database schema | `supabase/migrations/*.sql` (users, refresh_tokens, sessions, auth_tokens, email_verifications, invitations) |
| Audit logging | `lib/audit/log.ts` |

Confirm your understanding by listing:
- Current login flow
- Current session lifecycle
- Current role enforcement points
- Current rate-limit tiers

Do **not** start coding until this audit is complete.

---

## 3. BATCH PLAN

| Batch | Items | Theme |
|-------|-------|-------|
| **Batch A** | 1, 2, 4, 7 | Auth core: forgot password, reset, sign-in rate limit, server-side checks |
| **Batch B** | 5, 6, 3 | Invitations & signup: password-on-invite, acceptance, signup validation |
| **Batch C** | 8, 9, 10 | Roles, impersonation, session timeout |
| **Batch D** | 11, 12 | Logout hardening, email verification |
| **Batch E** | 13, 14, 15 | MFA foundation, OAuth foundation, password strength UI |

Each batch ends with:
1. Full local test run (`npm test`, `npm run test:e2e`, `npm run build`)
2. Manual verification checklist
3. Commit per file with conventional commits
4. Report + deploy

---

# BATCH A — Auth Core Hardening

## ITEM 1 — Fix Forgot Password Flow

### Objective
Ensure `/api/auth/forgot-password` generates a secure, single-use, time-limited token and dispatches a working email — without leaking whether the email exists.

### Files to Inspect
- `app/api/auth/forgot-password/route.ts`
- `lib/auth/password-reset.ts` (`createPasswordResetToken`)
- `lib/email/sender.ts` (`sendEmail`)
- `lib/email/templates.ts` (any reset-password template)
- `lib/security/rate-limit.ts` (rate-limit tiers)
- `lib/audit/log.ts`

### Implementation Steps
1. **Token generation**: Confirm `createPasswordResetToken(email)` produces a 64-char hex raw token, stores SHA-256 hash in `auth_tokens` with `type = 'password_reset'`, expires in 1 hour, and invalidates prior unconsumed tokens for the same email.
2. **Email dispatch**: Create or confirm a reset-password email template in `lib/email/templates.ts`:
   - Subject: `Reset your password`
   - HTML + plain text versions
   - Link: `${APP_PUBLIC_URL}/auth/reset-password?token=<raw>&email=<encoded>`
   - Expiry notice: "This link expires in 1 hour."
3. **Send email**: In the route handler, after generating the token, call `sendEmail({ to, subject, html, text })`. If sending fails, log it and **still return the same success message** (do not reveal failure to the client).
4. **Response behavior**: Always return `{ message: "If an account exists with this email, a password reset link has been dispatched." }` with HTTP 200 — regardless of whether the email exists. In dev only, you may return `token`/`url` for testing.
5. **Rate limiting**: Apply `INVITE_RATE_LIMITS.PASSWORD_RESET_SEND = { maxRequests: 3, windowMs: 60 * 60 * 1000 }` per email + per IP. Return 429 with `Retry-After` on exceed.
6. **Audit log**: Log `PASSWORD_RESET_REQUESTED` with hashed email (never raw).

### Acceptance Criteria
- [ ] Endpoint returns 200 with generic message for both existing and non-existing emails.
- [ ] Reset token is stored as SHA-256 hash only (never raw).
- [ ] Email is dispatched via the configured provider (Mailcow/SMTP).
- [ ] Prior unconsumed reset tokens for the same email are invalidated.
- [ ] Rate limit enforced at 3/hour per email.
- [ ] Audit event `PASSWORD_RESET_REQUESTED` written.
- [ ] Unit test: existing email → token row created + email sent.
- [ ] Unit test: non-existing email → no token row + no email + same 200 response.
- [ ] Unit test: 4th request within 1 hour → 429.

---

## ITEM 2 — Fix Password Reset Link Handling

### Objective
Ensure `/api/auth/reset-password` (and the corresponding UI page) works end-to-end: consumes token atomically, validates strength, updates password, revokes all sessions.

### Files to Inspect
- `app/api/auth/reset-password/route.ts`
- `lib/auth/password-reset.ts` (`verifyPasswordResetToken`, `resetPassword`)
- `lib/auth/password.ts` (`hashPassword`, `validatePasswordStrength`)
- `lib/db/index.ts` (`transaction`)
- The reset-password UI page (likely `app/(auth)/reset-password/page.tsx` — create if missing)

### Implementation Steps
1. **Atomic token consumption**: In `resetPassword()`, wrap in a `transaction()`:
   - `SELECT ... FOR UPDATE` on the auth_tokens row.
   - Verify `is_used = false` and `expires_at > NOW()`.
   - Update `is_used = true`.
   - Update user `password_hash`.
   - Revoke **all** refresh_tokens for that user (`is_revoked = true`).
2. **Password strength**: Reject passwords < 8 chars, missing uppercase/lowercase/digit. Return the specific error.
3. **Clear user-facing errors**:
   - Invalid/expired/used token → `"This reset link is invalid or has expired. Please request a new one."`
   - Weak password → return the strength errors.
4. **UI page** (create if missing): `app/(auth)/reset-password/page.tsx`:
   - Reads `token` and `email` from query string.
   - Password + confirm-password fields with strength meter (see Item 15).
   - Submit to `/api/auth/reset-password`.
   - On success → redirect to `/login?reset=success` with a toast.
5. **Audit log**: `PASSWORD_RESET_COMPLETED` on success.

### Acceptance Criteria
- [ ] Reset succeeds with valid token + strong password.
- [ ] Second use of same token fails with clear message.
- [ ] Expired token fails with clear message.
- [ ] Weak password rejected with specific errors.
- [ ] All existing refresh tokens for the user are revoked after reset.
- [ ] UI page renders, submits, and redirects correctly.
- [ ] Unit test: happy path.
- [ ] Unit test: reused token rejected.
- [ ] Unit test: expired token rejected.
- [ ] Unit test: weak password rejected.
- [ ] Unit test: concurrent double-submit → only one succeeds.

---

## ITEM 4 — Fix Sign-In Rate Limiting (No 429 on HTML Pages)

### Objective
The login page currently returns 429 "Please wait N seconds before requesting another verification email." on HTML page loads. This is a critical bug — the rate limiter is being applied to browser navigation and the message is leaking from an unrelated rate-limit bucket.

### Root Cause Analysis (confirm before fixing)
Two problems exist simultaneously:
1. **Rate limiter is running on HTML routes** in `middleware.ts` / `middleware/rate-limit.ts`.
2. **Login/signup pages are calling `verify-email/send` automatically** (likely on mount or via a form action), which triggers the `VERIFY_EMAIL_SEND` bucket and displays its error.

### Files to Inspect
- `middleware.ts`
- `middleware/rate-limit.ts`
- `lib/security/rate-limit.ts`
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `components/auth/EmailVerificationBanner.tsx`
- Any layout or provider that wraps auth pages

### Implementation Steps
1. **Scope rate limiting to API only**: In `middleware/rate-limit.ts`, ensure the guard is:
   ```ts
   const isApiRoute = pathname.startsWith('/api/');
   const isWebhook  = pathname.startsWith('/api/webhooks/') || pathname.startsWith('/api/stripe/webhook');
   const isPortalAuth = pathname.startsWith('/client/auth/');
   if (!isApiRoute && !isPortalAuth) return null; // never rate-limit HTML
   ```
   Confirm this is applied for every HTML route including `/login`, `/signup`, `/auth/*`.
2. **Remove auto-call to verify-email/send**: Grep the entire codebase for `verify-email/send`, `verifyEmailSend`, `sendVerificationEmail`. Ensure it is only called from `EmailVerificationBanner.tsx` inside an explicit `onClick` handler. Remove any `useEffect` auto-fire.
3. **Fix the generic message leak**: In `lib/security/rate-limit.ts`, `createRateLimitExceededResponse()` should accept a `customMessage` argument and default to a generic `"Too many requests. Please try again later."` — not the email-specific message.
4. **Login rate-limit tiers** (apply to `/api/auth/login` only):
   - Per email: 10 attempts / 15 minutes.
   - Per IP: 50 attempts / 15 minutes.
   - Successful login resets the per-email counter.
5. **Return 429 as JSON**, not as a page — the login page must catch and display it inline with a countdown.

### Acceptance Criteria
- [ ] Visiting `/login`, `/signup`, `/auth/reset-password` in a fresh browser never returns 429.
- [ ] `POST /api/auth/login` with wrong credentials 11 times returns 429 with a generic JSON message.
- [ ] Login page displays the countdown inline, not as raw JSON.
- [ ] `verify-email/send` is only called from an explicit user click.
- [ ] Network panel shows zero calls to `verify-email/send` when the login page loads.
- [ ] Unit test: 11th login attempt → 429 with generic message.
- [ ] Unit test: HTML route never rate-limited.
- [ ] Playwright test: open `/login` and reload 20 times → no 429.

---

## ITEM 7 — Server-Side Auth Checks in All Server Actions

### Objective
Audit every `'use server'` file and every API route handler. Confirm each one:
1. Verifies the session.
2. Verifies the role for privileged operations.
3. Scopes every DB query by `organization_id` from session (never client input).

### Files to Inspect
- All files starting with `'use server'` in `app/actions/` and `app/**/actions.ts`.
- All `app/api/**/route.ts` handlers.

### Implementation Steps
1. **List every action** with a table: file, function, session check (Y/N), role check (Y/N), tenant scoping (Y/N).
2. **Fix every N**: Add `getCurrentSessionContext()` at the top. Return `{ error: 'Unauthorized' }` if no session.
3. **Add role guards** to privileged actions (delete, billing, member management): use `session.role === 'owner' || 'admin'`.
4. **Enforce tenant scoping**: Every query must include `AND organization_id = $sessionOrg`. If a client-supplied `orgId` mismatches the session, return 404 (not 403).
5. **Do not trust query params or body** for `orgId`, `userId`, `role`.
6. **Add a regression test** that calls each action without a session and expects `{ error: 'Unauthorized' }`.

### Acceptance Criteria
- [ ] 100% of server actions verify session.
- [ ] 100% of privileged actions verify role.
- [ ] 100% of DB queries scoped by session's `orgId`.
- [ ] Integration test covers each action's unauthorized path.
- [ ] No client-supplied `orgId` can override session.

---

# BATCH B — Invitations & Signup

## ITEM 5 — Direct Password Creation During Invite

### Objective
Allow an owner/admin to set a temporary password when inviting a user, as an alternative to magic-link flow. The invited user can either:
- Accept via the invite link and set their own password, OR
- Log in with the temp password immediately (and be forced to change it on first login).

### Files to Inspect
- `lib/services/invitation-service.ts`
- `app/api/invitations/route.ts`
- `components/settings/InviteMemberDialog.tsx`
- `lib/db/repositories/invitation-repo.ts`
- `supabase/migrations/0035_invitations.sql`

### Implementation Steps
1. **Schema**: Add `temp_password_hash TEXT NULL` and `require_password_change BOOLEAN NOT NULL DEFAULT false` to `invitations` via a new migration (e.g. `0045_invitation_temp_password.sql`).
2. **Service**: In `createInvitation()`:
   - Accept optional `password` in the input.
   - If provided, hash with `hashPassword()` and store in `temp_password_hash`, set `require_password_change = true`.
   - Do not send the temp password in the email — instruct the inviter to share it out-of-band.
3. **Acceptance flow**: In `acceptInvitation()`:
   - If a temp password exists and matches, mark accepted and set `users.require_password_change = true`.
   - Otherwise, require the user to set a password (existing flow).
4. **UI**: In `InviteMemberDialog.tsx`, add a toggle: **"Set temporary password (optional)"**. When on, show password + confirm fields with the strength meter from Item 15. Show a warning: "The user will be forced to change this password on first login."
5. **Migration for users**: Add `users.require_password_change BOOLEAN NOT NULL DEFAULT false`.
6. **Login gate**: If `user.require_password_change = true`, redirect to `/auth/change-password?required=1` after login, blocking all other dashboard routes until changed.

### Acceptance Criteria
- [ ] Invite can be sent with or without a temp password.
- [ ] Temp password is hashed (never stored or emailed in plaintext).
- [ ] User logs in with temp password → forced to change password.
- [ ] If temp password is wrong, user is directed to set their own via invite link.
- [ ] Migration is idempotent.
- [ ] Unit test: invite with password → hash stored.
- [ ] Unit test: login with temp password → require_password_change = true.

---

## ITEM 6 — Invite Acceptance Flow

### Objective
Ensure the invited user can:
1. Open the invite link.
2. See the correct organization name and masked email.
3. Sign up (if new) or log in (if existing).
4. Accept the invitation and be added to the organization with the correct role.

### Files to Inspect
- `app/invite/[token]/page.tsx`
- `app/invite/[token]/AcceptInviteButton.tsx`
- `app/api/invitations/accept/route.ts`
- `app/api/invitations/accept-info/route.ts`
- `lib/services/invitation-service.ts` (`acceptInvitation`, `getInvitationAcceptInfo`)
- `app/(auth)/signup/page.tsx` (invite-aware signup)
- `app/actions/signup.ts` (`handleSignUpWithInviteAction`)

### Implementation Steps
1. **Accept-info endpoint**: `GET /api/invitations/accept-info?token=...` returns:
   - `organizationName`, `domain`, `maskedEmail`, `role`, `accountExists`.
   - Never return the full email.
2. **Invite page states**: Confirm the existing page handles all 5 states:
   - Invalid/expired → generic error with sign-in link.
   - Needs account → signup CTA with email locked.
   - Logged in, matching email → "Accept" button.
   - Logged in, different email → "Switch account" CTA.
   - Accepted → redirect to `/dashboard`.
3. **Accept endpoint**: `POST /api/invitations/accept` requires a session. Runs inside a transaction:
   - Lock invitation row.
   - Re-verify: not expired, not revoked, not accepted.
   - Re-verify email matches session.
   - Check seat limit **at acceptance time** (plan may have changed).
   - Insert `organization_members`.
   - Mark invitation accepted.
   - Log `invite.accepted`.
4. **Invite-aware signup**: Confirm `handleSignUpWithInviteAction` locks the email to the invitation address, does not create a new organization, and auto-accepts the invite after signup.

### Acceptance Criteria
- [ ] All 5 invite page states render correctly.
- [ ] Email matching enforced server-side (case-insensitive).
- [ ] Seat limit re-checked at acceptance time.
- [ ] Concurrent double-accept → exactly one membership.
- [ ] Second use of same token → clear error.
- [ ] Playwright E2E: invite → signup → join → dashboard.

---

## ITEM 3 — Signup Page Server-Side Validation

### Objective
Signup must reject invalid input server-side, enforce email uniqueness, enforce strong passwords, and optionally require email verification.

### Files to Inspect
- `app/(auth)/signup/page.tsx`
- `app/actions/signup.ts`
- `app/api/auth/signup/route.ts`
- `lib/auth/password.ts`
- `lib/validation/email.ts`

### Implementation Steps
1. **Server validation**: Use Zod schemas (`lib/validation/schemas.ts`) to validate:
   - `fullName`: 2–100 chars, no `<` or `>`.
   - `orgName`: 2–100 chars.
   - `email`: RFC-compliant, lowercase, trimmed.
   - `password`: min 8 chars, uppercase, lowercase, digit.
2. **Duplicate email**: Return 409 with `"An account with this email already exists."` — do not leak whether user exists in an org.
3. **Rate limiting**: 5 signups / hour per IP.
4. **Email verification**: On successful signup:
   - Send verification email via `verify-email/send` logic.
   - Allow login but mark account as `email_verified = false`.
   - Show banner on dashboard until verified.
5. **Error responses**: Return structured JSON `{ error, fieldErrors }` so the UI can highlight specific fields.

### Acceptance Criteria
- [ ] Invalid email → 400 with field error.
- [ ] Weak password → 400 with specific strength errors.
- [ ] Duplicate email → 409 with generic message.
- [ ] 6th signup within 1 hour → 429.
- [ ] Verification email is dispatched (or console-logged in dev).
- [ ] UI shows inline errors for each field.
- [ ] Unit test: each validation failure.

---

# BATCH C — Roles, Impersonation, Sessions

## ITEM 8 — Role-Based Access Consistency

### Objective
Enforce `owner > admin > member > viewer` (and `billing_manager` as a scoped role) consistently across:
- All API routes
- All server actions
- All UI screens (hide unauthorized actions)
- Database RLS policies

### Files to Inspect
- `lib/auth/middleware.ts` (`withRole`)
- `lib/services/invitation-service.ts` (role rules)
- `lib/team/actions.ts`
- All `'use server'` files
- `supabase/migrations/0039_add_viewer_role.sql` and RLS policies

### Implementation Steps
1. **Centralize role hierarchy** in `lib/auth/roles.ts`:
   ```ts
   export const ROLE_HIERARCHY = { owner: 4, admin: 3, member: 2, viewer: 1, billing_manager: 0 };
   export function hasMinimumRole(userRole, required) { ... }
   ```
2. **Apply everywhere**: Replace ad-hoc role checks with `hasMinimumRole()`.
3. **Document the capability matrix** in `docs/roles-matrix.md`:
   - Client CRUD, project CRUD, task CRUD, invite, remove, billing, audit-log view, export, delete-org.
4. **RLS alignment**: Confirm RLS policies use the same hierarchy.
5. **UI consistency**: Hide buttons the user can't use; do not just disable them.
6. **Test matrix**: For each role, test each capability and assert the expected allow/deny.

### Acceptance Criteria
- [ ] Single source of truth for role hierarchy.
- [ ] Docs matrix exists and matches implementation.
- [ ] RLS matches server-side checks.
- [ ] UI hides unauthorized actions.
- [ ] Test covers all 5 roles × 8 capabilities.

---

## ITEM 9 — Super Admin Impersonation (Read + Write with Audit)

### Objective
Extend impersonation from read-only to full read/write **with mandatory audit logging** and a **red banner** in the UI showing support mode is active.

### Files to Inspect
- `lib/auth/impersonation.ts`
- `app/api/super-admin/impersonate/route.ts`
- `components/super-admin/impersonation-banner.tsx`
- `components/super-admin/support-banner-wrapper.tsx`
- `lib/audit/log.ts`

### Implementation Steps
1. **Cookie payload**: Add `mode: 'read' | 'write'` to the impersonation cookie.
2. **API**: `POST /api/super-admin/impersonate` accepts `{ organizationId, organizationName, mode }`. Only super_admin can call.
3. **Audit**: On start, log `SUPER_ADMIN_IMPERSONATION_START` with `{ orgId, mode, expiresAt }`. On end, log `SUPER_ADMIN_IMPERSONATION_END`.
4. **Server actions**: In write mode, prefix all audit events with `IMPERSONATED_BY_SUPER_ADMIN` metadata (`actorId`, `impersonatedOrgId`).
5. **UI banner**: Sticky top banner showing "Viewing as [Org] — Support Mode ([Read-Only | Read+Write]) — Expires at HH:MM" with an "Exit support mode" button.
6. **Auto-expire**: 1-hour max. Cookie enforces; server re-verifies on every request.
7. **Block sensitive ops**: Even in write mode, block: org deletion, plan changes, user deletion. These require leaving impersonation.

### Acceptance Criteria
- [ ] Cookie carries mode.
- [ ] Banner reflects mode and time remaining.
- [ ] Every action while impersonating logged with super admin identity.
- [ ] Auto-expire at 1 hour.
- [ ] Blocked sensitive ops return 403 with clear message.
- [ ] Unit test: read mode blocks writes.
- [ ] Unit test: write mode allows writes but logs.

---

## ITEM 10 — Session Timeout & Refresh Token Rotation

### Objective
Harden session lifecycle:
- Access token: 30 min (already set).
- Refresh token: 7 days, rotates on every use.
- Detect token reuse (family invalidation).
- Warn user 2 min before access token expiry.

### Files to Inspect
- `lib/auth/jwt.ts`
- `lib/auth/session.ts`
- `app/api/auth/refresh/route.ts`
- `app/api/auth/login/route.ts`
- `supabase/migrations/0001_init_auth_system.sql` (`refresh_tokens` table)

### Implementation Steps
1. **Rotation**: On every `/api/auth/refresh`:
   - Verify refresh token.
   - Check `token_family` in DB.
   - If the presented token is already revoked → **invalidate the entire family** (assume theft).
   - Issue new access + refresh pair.
   - Mark old refresh token revoked.
2. **Family tracking**: Confirm `refresh_tokens.token_family` is set at login and preserved across rotations.
3. **Reuse detection**: Log `REFRESH_TOKEN_REUSE_DETECTED` on family invalidation.
4. **UI warning**: In a client-side `SessionProvider`, warn user 2 min before access token expires. Provide "Stay signed in" (calls refresh) and "Sign out" options.
5. **Refresh on focus**: On window focus, if access token expires within 5 minutes, silently refresh.
6. **Tests**: Full rotation cycle; reused token invalidates family; expired refresh token rejects.

### Acceptance Criteria
- [ ] Refresh rotates and invalidates the old token.
- [ ] Reused token invalidates the family.
- [ ] UI warns before expiry.
- [ ] Auto-refresh on focus.
- [ ] Unit tests cover all paths.

---

# BATCH D — Logout & Verification

## ITEM 11 — Logout Hardening

### Objective
Logout must:
1. Revoke the refresh token in the database.
2. Clear all auth cookies (session + refresh + org).
3. Redirect to `/login`.
4. Work even if the DB is unreachable (best-effort revocation).

### Files to Inspect
- `app/api/auth/logout/route.ts`
- `lib/auth/session.ts` (`deleteRefreshTokenCookie`)
- `components/shell/Topbar.tsx` (sign-out button)

### Implementation Steps
1. **Revoke refresh**: Hash the cookie's refresh token, set `is_revoked = true`. Wrap in try/catch.
2. **Clear cookies**: Delete `innoventix_session`, `innoventix_refresh`, `organization_id`, `impersonation_session`, `active_org_id`.
3. **Response**: Return 200 JSON with `{ message: 'Logged out' }` and `Set-Cookie` headers clearing all above with `maxAge: 0`.
4. **Client**: After logout, hard-navigate to `/login` via `window.location.assign('/login')` (not router.push) to reset all client state.
5. **Audit**: Log `USER_LOGGED_OUT`.

### Acceptance Criteria
- [ ] All auth cookies removed after logout.
- [ ] Refresh token revoked in DB.
- [ ] Redirect to `/login`.
- [ ] Works even if DB errors.
- [ ] Unit test: logout clears cookies and revokes token.

---

## ITEM 12 — Email Verification End-to-End

### Objective
Confirm the email verification flow works: send → receive → click → verify → banner disappears.

### Files to Inspect
- `app/api/auth/verify-email/send/route.ts`
- `app/api/auth/verify-email/confirm/route.ts`
- `components/auth/EmailVerificationBanner.tsx`
- `lib/db/repositories/email-verification-repo.ts`
- `lib/email/templates.ts` (verify-email template)
- `supabase/migrations/0036_email_verifications.sql`

### Implementation Steps
1. **Send**: 1 send / 60 seconds per user. Invalidates older unconsumed tokens. Dispatches email with link to `${APP_PUBLIC_URL}/verify-email?token=...`.
2. **Confirm**: Atomically consume token; set `users.email_verified_at = NOW()`. Reject already-used, expired, or invalid tokens with generic message.
3. **Banner**: Shows on `/dashboard` and `/settings/*` only when `email_verified_at IS NULL`. Dismissible for session only.
4. **Hide on verify**: After confirm, refresh session context so banner disappears.
5. **Tests**:
   - Send → token row created.
   - Confirm → email_verified_at set.
   - Reused token → rejected.
   - Expired token → rejected.
   - Rate limit enforced.

### Acceptance Criteria
- [ ] Email is dispatched with valid link.
- [ ] Confirm sets verified status.
- [ ] Banner hides after verification.
- [ ] Rate limiting works.
- [ ] Playwright: full flow.

---

# BATCH E — Foundations & Polish

## ITEM 13 — MFA / TOTP Foundation (Optional but Recommended)

### Objective
Add a TOTP-based MFA foundation (Google Authenticator / Authy compatible) that can be enabled per user, with recovery codes.

### Files to Create
- `supabase/migrations/0046_user_mfa.sql`
- `lib/auth/mfa.ts`
- `app/api/auth/mfa/enroll/route.ts`
- `app/api/auth/mfa/verify/route.ts`
- `app/api/auth/mfa/disable/route.ts`
- `app/(dashboard)/settings/security/page.tsx`
- `components/auth/MFAChallenge.tsx`

### Implementation Steps
1. **Schema**: Add `users.mfa_secret TEXT NULL`, `users.mfa_enabled BOOLEAN DEFAULT false`, `users.mfa_recovery_codes JSONB DEFAULT '[]'`.
2. **Enroll**: Generate TOTP secret with `otplib`. Return QR code (data URI) and 10 recovery codes. Do not enable until user confirms with a valid 6-digit code.
3. **Challenge**: After password login, if `mfa_enabled`, require TOTP code before issuing session.
4. **Verify**: Compare code with ±1 time-step tolerance.
5. **Recovery**: Allow one-time use of recovery codes; remove used code from array.
6. **Disable**: Require password + current TOTP.
7. **UI**: In `settings/security`, allow enabling/disabling MFA and regenerating recovery codes.

### Acceptance Criteria
- [ ] Enroll → verify → enabled.
- [ ] Login requires TOTP when enabled.
- [ ] Recovery codes work and are single-use.
- [ ] Disable requires password + TOTP.
- [ ] Tests cover all paths.

---

## ITEM 14 — OAuth Foundation (Google + GitHub)

### Objective
Add OAuth 2.0 login via Google and GitHub as an alternative to password login. Link OAuth identity to existing accounts by verified email.

### Files to Create
- `supabase/migrations/0047_oauth_accounts.sql`
- `lib/auth/oauth/google.ts`
- `lib/auth/oauth/github.ts`
- `app/api/auth/oauth/[provider]/route.ts`
- `app/api/auth/oauth/[provider]/callback/route.ts`
- Update login page with provider buttons

### Implementation Steps
1. **Schema**: `oauth_accounts(id, user_id, provider, provider_user_id, email, created_at)` with unique `(provider, provider_user_id)`.
2. **Google flow**:
   - Redirect to Google OAuth consent.
   - Callback exchanges code → ID token → email.
   - If email exists in `users` → link to that account.
   - If not → create user with `email_verified = true` and `oauth_accounts` row.
   - Issue session.
3. **GitHub flow**: Same pattern.
4. **Env vars**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `OAUTH_REDIRECT_BASE`.
5. **UI**: Add "Continue with Google" and "Continue with GitHub" buttons on `/login` and `/signup`.
6. **Security**: Verify state parameter to prevent CSRF; verify `email_verified = true` from provider.

### Acceptance Criteria
- [ ] Google login works end-to-end.
- [ ] GitHub login works end-to-end.
- [ ] Existing email is linked, not duplicated.
- [ ] CSRF state protected.
- [ ] Env vars documented in `.env.example`.

---

## ITEM 15 — Password Strength Meter (Signup + Reset + Invite)

### Objective
Add a reusable password strength meter to all password inputs.

### Files to Create
- `components/auth/PasswordStrengthMeter.tsx`
- `lib/validation/password-strength.ts` (shared scoring logic)

### Implementation Steps
1. **Scoring**: 0–4 score based on:
   - Length ≥ 8, ≥ 12, ≥ 16
   - Has uppercase, lowercase, digit, symbol
   - Not in common-password list (top 10k)
2. **UI**: Horizontal bar with 5 segments; color: red → orange → yellow → lime → green. Label: Weak / Fair / Good / Strong / Excellent.
3. **Rules checklist**: Show inline checklist:
   - ✓ At least 8 characters
   - ✓ Contains uppercase letter
   - ✓ Contains lowercase letter
   - ✓ Contains number
   - (Optional) Contains symbol
4. **Reuse**: Use same component in `/signup`, `/reset-password`, `/settings/security`, and `InviteMemberDialog` (Item 5).
5. **Server alignment**: The scoring rules must match `validatePasswordStrength()` in `lib/auth/password.ts`.

### Acceptance Criteria
- [ ] Meter shown on all password inputs.
- [ ] Score updates live as user types.
- [ ] Checklist ticks as rules are met.
- [ ] Submit disabled until score ≥ "Fair" (2/4).
- [ ] Server rejects anything the meter would reject.

---

## 4. TESTING REQUIREMENTS (ALL BATCHES)

For every batch, add or update:

### Unit Tests (`tests/auth/*.test.ts`)
- Happy path for each endpoint.
- Failure path for each endpoint.
- Rate limit boundary.
- Role boundary.
- Token reuse.
- Cross-tenant isolation.

### Integration Tests (`tests/integration/*.test.ts`)
- Full login → session → refresh → logout cycle.
- Full signup → verify → login cycle.
- Full invite → accept → join cycle.
- MFA enroll → login → challenge cycle.

### E2E Tests (`e2e/auth/*.spec.ts`)
- Signup → dashboard → logout.
- Login with wrong password → inline error → correct → dashboard.
- Forgot password → email → reset → login.
- Invite → signup with invite → join → see org.
- MFA enroll → logout → login → TOTP challenge.

### Performance & Security Tests
- Lighthouse on `/login`, `/signup` → Performance ≥ 90, Accessibility ≥ 95.
- Rate limit burst: 100 requests to `/api/auth/login` → exactly the configured allow, rest 429.
- CSRF: POST without CSRF token → 403.

---

## 5. FINAL ACCEPTANCE CHECKLIST

Before declaring the auth hardening complete:

- [ ] Every item 1–15 has its own acceptance criteria fully met.
- [ ] All unit tests pass (0 failures).
- [ ] All integration tests pass (0 failures).
- [ ] All E2E tests pass (0 failures).
- [ ] `npm run build` succeeds with 0 errors.
- [ ] `npm run lint` succeeds with 0 errors.
- [ ] No hardcoded secrets in the repo (`gitleaks` scan clean).
- [ ] `.env.example` updated with all new variables.
- [ ] `docs/roles-matrix.md` and `docs/auth-architecture.md` written.
- [ ] Browser verification: login, signup, forgot-password, reset, invite-accept, logout, email-verify, MFA, OAuth — all confirmed in light + dark mode.
- [ ] Zero 429 errors on HTML page navigation.
- [ ] Zero raw JSON error pages displayed to users.
- [ ] Zero cross-tenant data leaks in integration tests.

---

## 6. BATCH EXECUTION SCRIPT (FOR THE USER)

For each batch:

1. **Paste this prompt's relevant batch section** into your coding AI (Antigravity/Cursor/Claude Code).
2. Let the AI implement + test locally.
3. Run manually:
   ```bash
   npm run lint
   npm test
   npm run test:e2e
   npm run build
   ```
4. Manually verify each Acceptance Criteria checkbox in the browser.
5. Commit per file with the recommended message.
6. Deploy to staging (Coolify).
7. Re-verify on staging.
8. Deploy to production.
9. Update `MIGRATION_EXECUTION_LOG.md` with batch results.
10. Move to next batch.

**Do not start Batch N+1 until Batch N is fully verified on staging.**

---

## 7. REPORTING FORMAT (END OF EACH BATCH)

The AI must output:

```
BATCH: A
ITEMS COMPLETED: 1, 2, 4, 7

FILES CHANGED:
- app/api/auth/forgot-password/route.ts — added email dispatch
- lib/auth/password-reset.ts — atomic token consumption
- middleware/rate-limit.ts — scoped to API routes only
- lib/security/rate-limit.ts — generic message fix
- ...

NEW FILES:
- docs/roles-matrix.md
- lib/auth/roles.ts
- components/auth/PasswordStrengthMeter.tsx
- ...

TESTS ADDED:
- tests/auth/forgot-password.test.ts (5 tests)
- tests/auth/reset-password.test.ts (4 tests)
- tests/auth/login-rate-limit.test.ts (3 tests)
- ...

TEST RESULTS:
- Unit: 12/12 pass
- Integration: 4/4 pass
- E2E: 2/2 pass
- Build: success
- Lint: success

MANUAL VERIFICATION:
- Login page: no 429 on 20 reloads ✓
- Forgot password: email received ✓
- Reset: password changed, old sessions revoked ✓
- Server actions: unauthorized test passes ✓

NOT VERIFIED:
- Email delivery to real Gmail inbox (SMTP configured in staging, not tested live)
- MFA (Batch E)

BLOCKERS: None
NEXT BATCH: B (Items 5, 6, 3)
```

---

## 8. FINAL NOTES

- **Do not skip verification.** The single biggest failure mode is claiming completion without checking.
- **Report honestly.** "Not yet verified" is acceptable. Fabrication is not.
- **Work in small commits.** One logical change = one commit.
- **Ask before deviating.** If an item's spec conflicts with existing code, stop and report.
- **Keep the audit log clean.** Every auth event must be recorded.

---

**End of Master Prompt.**

