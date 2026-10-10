# 05 - Seed a default pipeline for each organization

Each organization should start with a usable pipeline.

1. Add a function `ensureDefaultPipeline(orgId, createdBy)` in the service layer. It creates a default pipeline named "Sales Pipeline" with these stages in order:
   - Lead (#94a3b8)
   - Qualified (#38bdf8)
   - Proposal (#a78bfa)
   - Negotiation (#fb923c)
   - Won (#22c55e, is_won = true)
   - Lost (#ef4444, is_lost = true)
2. Use positions 1000, 2000, 3000, and so on, so later inserts can go in between.
3. Make it idempotent: if the org already has a default pipeline, do nothing.
4. Call it from the existing organization creation or onboarding flow, right after the organization is created. Also run it once as a backfill for existing organizations inside the migration or a startup task.
5. Wrap creation in a transaction so a partial pipeline never persists.

Verify by creating a new workspace from the signup flow and checking that the pipeline and six stages exist in the database.
