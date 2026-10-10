# Innoventix Pipeline Fix Pack

Fixes the problems seen in the /leads screenshot before the production deploy.

## Run order
Run one prompt per Antigravity session, in order. Paste 00-CONTEXT.md first each time.
Do not start the next prompt until the current one passes its checks.

1. 01-fix-duplicate-on-move.md: a dragged deal appears in two columns
2. 02-editable-columns.md: rename, add, and delete columns
3. 03-column-order-colors-won-lost.md: reorder columns, colors, won/lost flags
4. 04-remove-test-data-and-secrets.md: remove test deals, scripts with passwords, and check git history
5. 05-env-audit.md: list every environment variable the app needs for Coolify
6. 06-production-safety.md: lock down demo routes, admin bootstrap, migrations
7. 07-e2e-tests.md: automated browser tests that catch these bugs
8. 08-deploy-checklist.md: push to deploy and verify on the live domain

## Rule
Nothing is pushed to `deploy` until 01 to 07 all pass locally.
