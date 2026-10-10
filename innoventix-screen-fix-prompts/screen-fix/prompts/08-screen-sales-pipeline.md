# 08: Sales Pipeline

Screen: /leads (Sales Pipeline). Checklist: checklists/08-sales-pipeline.md

Context: the board, move, rename, add, and delete were fixed in the pipeline fix pack. This prompt checks that those fixes still hold after the tenant fixes, and closes any gaps.

Fix:
1. Confirm the pipeline reads and writes only the current organization (re-run the tenant test from prompt 02 for pipeline endpoints).
2. Confirm the default pipeline is created for every organization, including ones created before the seed existed. Use the lazy fallback; do not require a manual step.
3. Confirm the deals count and open value in the header match the visible board, excluding Won and Lost, and archived deals.
4. Confirm clients shown in the deal form come from the current organization only.
5. Confirm the Forecast and Table views use the same filtered data as the board.

Test (Playwright): run the full sales pipeline suite from the fix pack, plus a second organization that sees its own default pipeline with six stages and no deals.

Verify: npm run build, npm test, npm run test:e2e -- pipeline. Report counts. Do not push.
