# 07 - Repository layer: deals

Create the deal repository.

- listBoard(orgId, pipelineId, filters): returns stages and their deals in one or two queries. Avoid N+1 queries. Limit each column to 100 cards by default and return a total count per stage so the UI can show "load more".
- getDeal(orgId, dealId): includes labels, checklists with items, and counts for comments.
- createDeal(orgId, input): appends at the bottom of the stage (position = max + 1000).
- updateDeal(orgId, dealId, input, expectedVersion): updates only the fields sent, increments version, and fails if the version doesn't match (returns a conflict result).
- archiveDeal(orgId, dealId): sets status to archived. Never hard-delete from the UI path.
- deleteDeal(orgId, dealId): hard delete, owner or admin only (permission check happens in the service layer).

Rules:
- Parameterized SQL only.
- Every query includes org_id.
- The version check must happen inside the same SQL statement (UPDATE ... WHERE id = $1 AND org_id = $2 AND version = $3).
- Add unit tests for the version conflict path.
