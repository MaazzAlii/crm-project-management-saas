# 07: Browser tests for the board

Use Playwright. Credentials come from environment variables E2E_EMAIL and E2E_PASSWORD only. Never put them in the test file.

Write tests that run against `http://localhost:3005` and must all pass:
1. Login and open /leads. The six default columns are visible.
2. Create a deal in Lead. It appears once.
3. Drag the deal to Qualified. It appears once in Qualified and not in Lead. Reload the page: it is still in Qualified and appears once in total.
4. Reorder two cards in one column. The order persists after reload.
5. Rename a column. It persists after reload.
6. Add a column, then delete it with its deals moved. The deals appear in the destination column once.
7. Move a deal to Won. The Won total updates.
8. Header open value equals the sum of open deal values shown on the board.

Add `npm run test:e2e`. Save screenshots of failures to `test-results/`, and do not commit that folder.
