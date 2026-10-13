# 09: Security recheck

Check each item and report pass or fail with the file and line:
1. Canonical host redirect uses an allowlist of hosts. It must never build a redirect from the request's Host or x-forwarded-host header without checking the allowlist. (Flag as blocker if not.)
2. Rate limiting still applies to every /api route, including login and verification. Confirm with a test.
3. Access tokens are the only bearer tokens accepted. No refresh-token fallback in getAuthFromRequest or getPipelineSession.
4. Session cookies: innoventix_session is HttpOnly and holds the access token; innoventix_refresh is HttpOnly and Secure in production.
5. Cron routes require CRON_SECRET, compared in constant time, and fail closed when unset.
6. Super admin: grant script requires --confirm; no hardcoded emails in app or lib code (grep).
7. No secrets in tracked files: run git grep for key shapes and report counts only.
8. Stripe webhook verifies the signature before any database write.
9. Tenancy tests pass against a real database with two organizations.

Output: checklist with pass/fail and locations.
