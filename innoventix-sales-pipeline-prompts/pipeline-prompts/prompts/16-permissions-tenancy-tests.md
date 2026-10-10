# 16 - Tenant isolation and permission test suite

Write a dedicated test suite that proves the security rules hold. This is required before the UI work begins.

Create two test organizations, each with an owner, an admin, a member, and a viewer. Then test:
- A user in org A cannot read, move, edit, comment on, or archive any pipeline, stage, deal, label, or checklist in org B. Expect 404 (not 403) for cross-org IDs.
- A viewer cannot create or move deals (403).
- A member cannot delete deals or reorder stages (403).
- An admin can delete deals and override WIP limits.
- An expired or tampered session cookie gets 401 on every new route.
- Request bodies cannot override org_id.

Use test data created by the test setup. Do not use real credentials. Read test credentials from environment variables only. All tests must pass before moving to the UI phase.
