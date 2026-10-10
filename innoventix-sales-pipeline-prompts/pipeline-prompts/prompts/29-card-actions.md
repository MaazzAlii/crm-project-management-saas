# 29 - Card actions: move, copy, archive, delete, undo

Add the Trello-style card actions in the sidebar and a "..." menu on the card detail.

- Move: opens a dialog to pick a pipeline, stage, and position. Uses the same move endpoint.
- Copy: duplicates the card (title with "(copy)", same value, labels, and checklists, but no comments or activity) into a chosen stage.
- Archive: sets status archived and removes the card from the board. Archived cards appear in an "Archived" view with a Restore button.
- Delete: admin only, with a confirmation that says the action cannot be undone.
- Undo toast: after archive or move, show a toast with an "Undo" button for 8 seconds. Undo reverses the action using the stored previous state and records the reversal in activity.

Keep every action permission-checked on the server, not just hidden in the UI.
