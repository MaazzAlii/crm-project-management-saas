# 56: Deploy and verify live (run only after 50 to 55 pass)

Local checks (paste results):
1. npm run lint, npm test, npm run build, npm run test:e2e (test:e2e must be fully green; list any skipped tests and why).
2. git status clean; git log origin/main..HEAD lists only intended commits.
3. Secret scan on those commits (no keys or tokens).

Then ask me for approval. After approval only:
4. git push origin main and git push deploy main.
5. In Coolify, confirm environment variables: EMAIL_PROVIDER, EMAIL_FROM, RESEND_API_KEY or SMTP settings, APP_PUBLIC_URL, STRIPE_* (test keys first), JWT and cookie settings. Then redeploy with no cache.
6. Record the deployed commit hash.

Live checks (I run these after deploy):
- /settings/team opens; Invite Member works; invite email arrives at the test address.
- Accept link works in a private window.
- Dashboard Invite Team button opens the dialog (no 404).
- /team?action=invite either redirects or shows the dialog; it must not show a raw 404 page.
- Stripe test checkout completes with card 4242 and the plan changes to Pro.

If any live check fails: stop, send the failing step and the last 30 lines of the runtime log. Do not push a fix blindly.
