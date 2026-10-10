# 24 - Card detail modal (open a card)

Clicking a card opens a Trello-style detail modal on desktop (centered, about 768px wide, with a dimmed backdrop). On mobile, it becomes a full-screen sheet.

Layout:
- Left (main): title (click to edit), stage name under the title ("in list Qualified"), description (click to edit, markdown-light: bold, italics, lists, links), checklists, comments and activity.
- Right (sidebar): Add to card list. Buttons for Labels, Checklist, Due date, Owner, Client, Value, Probability, Move, Archive, Delete.
- Editing a field saves on blur or Enter. Show a small "Saving..." then "Saved" indicator.
- Closing with Escape, the X, or a backdrop click. Unsaved text is saved on close.
- The URL changes to `/pipeline?deal=<id>` so the card can be linked and the browser back button closes it.

Use the APIs from prompts 13 and 14. Respect permissions: viewers see everything read only.
