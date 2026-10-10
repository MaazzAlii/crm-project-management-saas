# 06: Production safety

1. Demo routes: `app/api/seed-demo-data/route.ts` must return 404 when `NODE_ENV === 'production'`. Confirm the check happens before any database access. Add a test.
2. Admin bootstrap: the startup code in `lib/db/auto-migrate.ts` creates an admin user from environment variables. Confirm it:
   - reads ADMIN_EMAIL and ADMIN_PASSWORD from the environment, never from code
   - does nothing if the admin already exists
   - does not overwrite an existing password
   - fails clearly if the variables are missing in production, instead of using a default
3. Migrations: confirm migration 0034 and the pipeline seed are idempotent. Run the migration twice against the same database and confirm no errors and no duplicate rows (stages, labels).
4. JWT: confirm the app refuses to start in production when JWT_SECRET or REFRESH_TOKEN_SECRET is missing or shorter than 32 characters.
5. Cookies: confirm `Secure` is set when the request is HTTPS, and that `COOKIE_SECURE` overrides it.

Test each item and report pass or fail.
