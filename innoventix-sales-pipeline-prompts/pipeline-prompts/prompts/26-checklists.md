# 26 - Checklists

Add Trello-style checklists to the card detail.

- "Checklist" in the sidebar adds a checklist with a title (default "Checklist").
- Each checklist shows a progress bar and "x of y" count.
- Add items with an inline composer (Enter adds, Escape cancels).
- Click the checkbox to toggle done. Done items show a strikethrough.
- Drag items to reorder within a checklist (use dnd-kit sortable, same as cards).
- Click an item to edit its text. Delete items and checklists with a confirmation.
- The card on the board shows checklist progress (prompt 18).

All changes save through the service layer and record a checklist_updated activity.
