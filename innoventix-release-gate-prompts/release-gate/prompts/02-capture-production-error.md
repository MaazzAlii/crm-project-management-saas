# 02: Capture the production error behind digest 2093197446

1. Ask the owner for Coolify runtime logs: search for "2093197446" and copy 40 lines around it. Store in docs/release/prod-error-2093197446.log. Remove any cookie or token values before saving.
2. Find the stack trace. Name the file and line that throws.
3. Reproduce locally: NODE_ENV=production npm run build && npm run start, log in with a test owner account, open /dashboard. Record the server log output.
4. If the local error matches, record the exact function and the inputs that trigger it.
5. If it does not reproduce, say so and list the difference between local and production (env vars, database state, Next.js version).

Do not change code. Report the root cause or state that it is unknown.
