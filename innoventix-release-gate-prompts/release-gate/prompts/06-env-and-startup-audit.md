# 06: Environment and startup audit

1. grep -rn "process.env" app lib middleware.ts | list every variable.
2. For each, record: required in production or optional, default in code, and whether a missing value silently falls back.
3. Any variable with a silent fallback to a dev value (a placeholder key, a default secret, or a localhost URL) in production is a blocker.
4. Check that the app refuses to start in production when JWT_SECRET, REFRESH_TOKEN_SECRET, DATABASE_URL, or CRON_SECRET is missing or too short.
5. Compare the list with the owner's Coolify variable names (owner pastes names only, not values). Report missing and unexpected variables.

Output: table of variables with required/optional, fallback, and Coolify status.
