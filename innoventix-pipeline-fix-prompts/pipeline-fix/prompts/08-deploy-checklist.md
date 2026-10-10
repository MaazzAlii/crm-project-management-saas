# 08: Deploy checklist (run only after 01 to 07 pass)

1. Run `npm run build`, `npm test`, and `npm run test:e2e`. All must pass. Paste the summary counts.
2. Confirm the `git status` is clean, and `git log --oneline origin/main..HEAD` lists only the intended commits.
3. Confirm no secrets are in the commits to be pushed (re-run the secret scan from prompt 04).
4. Ask me for approval before running the push. Then push to `origin main` and to `deploy main`.
5. In Coolify: check that the environment variables from docs/env-coolify.md are set with production values, then click Redeploy with "no cache".
6. After the deploy, verify at https://project-manager.calara.agency:
   - login works and the cookie is `Secure`
   - /leads shows the six columns
   - create a deal, drag it, reload: it stays, once
   - /api/seed-demo-data returns 404
7. If any step fails, do not push a further fix blindly. Report the Coolify runtime log (last 30 lines) and the failing step.

Do not run prompt 8 steps 4 to 5 without my confirmation.
