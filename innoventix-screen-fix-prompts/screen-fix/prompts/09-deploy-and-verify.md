# 09: Deploy and verify (run after each screen or pair of screens)

Run only when the screen's Playwright test passes locally.

Local checks (report each result):
1. npm run lint
2. npm test
3. npm run build
4. npm run test:e2e
5. git status is clean, and git log origin/main..HEAD lists only the commits for these screens
6. Secret scan on those commits: no passwords, tokens, or database URLs. Print only file paths and line numbers.

Ask my approval, then (only after approval):
7. git push origin main
8. git push deploy main
9. Record the deploy commit: git rev-parse deploy/main

Coolify (I do this, not Antigravity):
10. Confirm environment variables match docs/env-coolify.md.
11. Redeploy with no cache. Wait for the build to finish and check the runtime log for startup errors.

Live verification (I run the checklist for each screen I changed):
12. Confirm the live build matches the recorded commit. The deployed commit must equal the one pushed.
13. Run the checklist file for each screen changed in this batch. Record pass or fail.
14. Any failure: stop, send me the failing line and the last 30 lines of the runtime log. Do not push a fix blindly.

Rollback: redeploy the previous commit recorded in step 9 of the last good deploy.
