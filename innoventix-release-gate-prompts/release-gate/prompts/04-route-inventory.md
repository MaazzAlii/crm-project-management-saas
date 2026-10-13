# 04: Route inventory

For every file matching app/**/page.tsx and app/**/route.ts:
- Route path
- Auth check (none, session, super admin, cron secret, webhook signature, public)
- Data scope (organization_id from session, or other)
- Error handling (returns typed error, throws, or unhandled)
- Status: OK / needs fix / needs review

Also list every middleware rule in middleware.ts and middleware/rate-limit.ts and say which routes they cover.

Output as a table, sorted by status. Include a count per status at the top.
