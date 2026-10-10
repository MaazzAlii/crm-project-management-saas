# 13 - API routes: deals and board

Routes:
- GET /api/pipelines/[pipelineId]/board?ownerId&labelId&q&minValue&maxValue&closeBefore&closeAfter&showClosed
  - Returns stages and their first page of deals, with counts and totals per stage.
- POST /api/deals
- GET /api/deals/[dealId]
- PATCH /api/deals/[dealId]: body includes expectedVersion
- DELETE /api/deals/[dealId]: admin only
- POST /api/deals/[dealId]/archive
- POST /api/deals/[dealId]/restore
- GET /api/deals/[dealId]/activity?cursor=

Apply the same rules as prompt 12 (session, validation, response shape, org scope).

Also add:
- GET /api/pipelines/[pipelineId]/stages/[stageId]/deals?cursor=: load more cards for one column.

Add tests for filter parsing and for the expectedVersion conflict response (409 with the current version).
