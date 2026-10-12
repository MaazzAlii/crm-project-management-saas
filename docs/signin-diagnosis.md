# Diagnosis: Sign-In HTTP 429 Error

## Summary Table

| Field | Detail |
|---|---|
| **Request Method & URL** | `GET /login` (and client-side navigation to `/login`) |
| **Originating Element** | Landing Page Header Sign In Link: `<Link href="/login">Sign In</Link>` (`app/page.tsx:66-71`) |
| **Intercepting Handler** | Middleware Rate Limiter: `handleRateLimiting(request)` (`middleware.ts:19` -> `middleware/rate-limit.ts:43`) |
| **Response Code** | `HTTP 429 Too Many Requests` |
| **Response Body** | `{"success":false,"error":{"message":"Rate limit exceeded. Please wait 30 seconds before requesting another verification email.","code":"RATE_LIMIT_EXCEEDED"},"retryAfterSeconds":30,"statusCode":429}` |
| **Root Cause** | Middleware rate limiting incorrectly included user-facing HTML pages (`/login`, `/signup`) in its target route regex/prefix list (`rl:auth`). When reverse proxy requests or user clicks exceeded 20 requests per minute, the middleware intercepted the page load and returned raw JSON with a hardcoded fallback error message copied from the verification email rate limiter. |

---

## Detailed Findings

1. **Sign In Elements**:
   - Landing page navigation header ([app/page.tsx#L66-L71](file:///home/maazzalii/Desktop/100%20days%20of%20code/91-crm-project-management-saas/app/page.tsx#L66-L71)): standard Next.js `<Link href="/login">Sign In</Link>`.
   - Login page form ([app/(auth)/login/page.tsx#L23-L27](file:///home/maazzalii/Desktop/100%20days%20of%20code/91-crm-project-management-saas/app/%28auth%29/login/page.tsx#L23-L27)): submits exclusively to `POST /api/auth/login` on form submit.

2. **Trigger for `RATE_LIMIT_EXCEEDED`**:
   - `RATE_LIMIT_EXCEEDED` appeared in 3 locations:
     - `app/api/auth/verify-email/send/route.ts:41`
     - `lib/security/rate-limit.ts:171`
     - `lib/utils/error-handler.ts:54`
   - It was returned on `GET /login` because `createRateLimitExceededResponse()` in `lib/security/rate-limit.ts` had a hardcoded default message: `"Rate limit exceeded. Please wait ${retryAfter} seconds before requesting another verification email."`.

3. **Email Verification Callers**:
   - `POST /api/auth/verify-email/send` is only invoked from `components/auth/EmailVerificationBanner.tsx:40` when a user explicitly clicks "Resend verification email" from the dashboard banner.
   - Neither the landing page nor the login page ever calls `verify-email/send`.

4. **Login Route**:
   - `app/api/auth/login/route.ts` does not contain any rate limit checks or verification email messages; the 429 was generated purely in `middleware.ts` before reaching the application route handler.
