# 10 - Service layer: deal business rules

Create `lib/pipeline/deal-service.ts` with the business rules. API routes and UI call only this layer, never the repositories directly.

Functions:
- createDeal(session, input)
- updateDeal(session, dealId, input)
- moveDeal(session, dealId, { toStageId, beforeId?, afterId?, expectedVersion })
- setDealStatus(session, dealId, status, lostReason?)
- archiveDeal, restoreDeal

Business rules:
- The stage must belong to the same pipeline and the same org.
- Moving into a stage with wip_limit reached is rejected unless the actor is an admin, and the error says which limit was hit.
- Moving into a won stage sets status = won and closed_at. Moving into a lost stage requires a lost_reason and sets status = lost.
- Moving out of a won or lost stage reopens the deal (status = open, closed_at = null) and records "reopened".
- Position is computed with positionBetween from the neighbors you were given. Rebalance the stage when needsRebalance is true.
- Every successful change writes an activity record.
- Check the session's org matches the deal's org.

Permissions:
- Viewer: read only
- Member: create, edit, move, comment
- Admin/owner: everything, including delete and WIP override

Use the existing role names from the auth system. Add tests for each rule.
