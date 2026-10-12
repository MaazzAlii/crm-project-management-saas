# 09: Deploy gate (do not run until 01 to 08 pass)

1. npm run lint, npm test, npm run build, npx playwright test e2e/signin-landing-to-dashboard.spec.ts. Paste the results.
2. git status clean; list the commits to be pushed.
3. Stop and ask me for written approval before pushing to origin or deploy.
4. After approval: push origin first, then deploy. Coolify redeploys from deploy.
5. Live checks: Sign In from the landing page reaches the dashboard in a private window; a wrong password shows an inline message; www redirects to the canonical host.

If any live check fails, stop and send me the failing step and the last 30 lines of the Coolify runtime log.
