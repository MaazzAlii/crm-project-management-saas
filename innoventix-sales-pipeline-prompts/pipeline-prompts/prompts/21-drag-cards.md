# 21 - Drag and drop cards (the core Trello behavior)

Install `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`. Wire up card dragging.

Behavior:
- Drag a card within its column to reorder it. Other cards slide out of the way with animation (about 200ms).
- Drag a card into another column. The destination column highlights. The card can be dropped at any position.
- While dragging, show a tilted ghost card under the cursor (DragOverlay). The original slot shows a placeholder.
- Dropping calculates before and after IDs from the destination column's current order, then calls the move endpoint from prompt 14.
- Optimistic update: the card moves instantly. If the server rejects it, roll back to the previous state and show a toast with the reason.
- On 409 VERSION_CONFLICT: refresh that deal from the server, apply the server version, and show "This deal was changed by someone else. We refreshed it."
- Dropping a card on the same position does nothing (no network call).

Use PointerSensor with an activation distance of 5px so clicks still open the card. Add KeyboardSensor for accessibility (full keyboard support comes in prompt 30).
