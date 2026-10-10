# 09 - Activity log service

Create a service that records what happens to each deal, so the card detail view can show a history like Trello's activity feed.

Create `lib/pipeline/activity.ts` with:
- `recordActivity(orgId, dealId, actorId, type, data)` inserts into deal_activities.
- `listActivity(orgId, dealId, limit = 50, cursor?)` returns newest first with cursor paging.

Event types and their data:
- created: { title, stageName }
- updated: { changes: { field: { from, to } } } (skip values that are unchanged)
- moved: { fromStageName, toStageName, fromPosition, toPosition }
- won, lost: { lostReason? }
- reopened: { fromStatus }
- comment_added: { commentId }
- checklist_updated: { checklistId, itemText?, isDone? }
- archived: {}

Rules:
- Activity writes must not break the main action. If logging fails, log the error and continue.
- Never store secrets or full descriptions in activity data. Store only field names and short labels.
- Add tests for the change-diff logic.
