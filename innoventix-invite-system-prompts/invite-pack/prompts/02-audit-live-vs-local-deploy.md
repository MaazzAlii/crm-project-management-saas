# 02: Compare local code, deployed code, and environment

Read-only.
1. Run git fetch deploy and report the commit at deploy/main and at local HEAD.
2. List commits on local main that are not on deploy/main, grouped by purpose.
3. For each commit touching team, invite, dashboard, or billing, say whether it is needed for the invite feature.
4. List the environment variables the app reads for email, Stripe, JWT, and cookies, from docs/env-coolify.md. Mark each as set in Coolify or missing. Do not print values; ask me to confirm which are set.
5. Confirm the live URL /team?action=invite returns 404 and /settings/team returns 200 (use curl with -I).

Report the findings. Do not deploy.
