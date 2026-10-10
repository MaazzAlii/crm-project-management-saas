# 40 - Documentation, screenshots, and deploy checklist

Finish the feature as a handover.

1. Write `docs/sales-pipeline.md`:
   - What the feature does, with a short feature list
   - How to use it (create a pipeline, add stages, add deals, drag to move, won and lost flow)
   - Roles and permissions table
   - API endpoint list with methods and purpose
   - Known limits (for example, polling instead of websockets)
2. Capture screenshots with a script (`scripts/capture-pipeline.ts`) that:
   - Reads the admin login from environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Never hardcode them.
   - Saves 8 screenshots to `docs/screenshots/pipeline/` at 1440x900: empty board, populated board, mid-drag, card detail, labels popover, checklist, forecast view, and mobile board.
3. Add a deploy checklist in `docs/deploy-pipeline.md`:
   - Migrations run automatically on startup (confirm this is how the existing system works)
   - Required environment variables: none new, unless listed
   - Smoke test steps after deploy: log in, open pipeline, create a deal, move it, reload
   - Rollback steps: revert the commit and redeploy in Coolify
4. Run `npm run build`, `npm test`, and `npm run test:e2e`. Report the results.

Do not push to any remote. Report the commit list so the owner can review before pushing.
