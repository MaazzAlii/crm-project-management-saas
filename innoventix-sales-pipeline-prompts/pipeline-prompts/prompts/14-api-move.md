# 14 - The move endpoint (the most important endpoint)

Create `POST /api/deals/[dealId]/move` for drag and drop.

Body:
{
  "toStageId": "uuid",
  "beforeId": "uuid or null",
  "afterId": "uuid or null",
  "expectedVersion": 3
}

Behavior, inside one database transaction:
1. Lock the deal row (SELECT ... FOR UPDATE) and check its version.
2. Check toStageId belongs to the same pipeline and org.
3. Read the neighbor positions (beforeId and afterId) and compute the new position with positionBetween.
4. If needsRebalance is true, rebalance the destination column in the same transaction.
5. Update stage_id, position, status (if the stage is won or lost), version + 1, and updated_at.
6. Write one "moved" activity.
7. Commit and return the updated deal and the new position.

Responses:
- 200: updated deal
- 409 VERSION_CONFLICT: include the current deal so the client can refresh
- 422 WIP_LIMIT: include the stage name and limit
- 422 LOST_REASON_REQUIRED: when moving into a lost stage without a reason (the UI sends the reason in the same request, or the endpoint returns this code)
- 404 and 403 as before

Add integration tests for: normal move, move within same column, concurrent moves causing a conflict, rebalance trigger, and won/lost transitions.
