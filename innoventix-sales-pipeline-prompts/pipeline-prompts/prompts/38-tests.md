# 38 - Automated tests

Add tests at three levels.

Unit (Vitest or the existing test runner):
- Position utility (prompt 08)
- Activity diff logic (prompt 09)
- Filter parsing and validation

Integration (against a test database):
- Deal service rules (prompt 10)
- Move endpoint (prompt 14), including conflict and WIP limit cases
- Tenant isolation suite (prompt 16) must still pass

End-to-end (Playwright):
- Log in as the test user (credentials from environment variables only)
- Create a deal in Lead
- Drag it to Qualified, reload, confirm it stayed in Qualified
- Reorder two cards in the same column
- Open the card, add a label, a checklist item, and a comment, then close and confirm they persist
- Move a card to Won and to Lost (with reason) and confirm the header totals update

Add a script `npm run test:e2e`. Document how to run the tests in `docs/testing.md`.
