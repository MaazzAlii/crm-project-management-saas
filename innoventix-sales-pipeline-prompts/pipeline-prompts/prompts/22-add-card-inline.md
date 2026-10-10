# 22 - Add a card inline (Trello composer)

At the bottom of each column, "+ Add a card" opens an inline composer:
- A textarea that auto-grows, with placeholder "Enter a title for this card..."
- Buttons: "Add card" (primary) and an X to cancel.
- Enter adds the card and keeps the composer open for the next card. Shift+Enter inserts a newline. Escape cancels.
- Title is required (1 to 200 characters). Show inline validation.
- The new card appears at the bottom of the column immediately (optimistic), then saves through POST /api/deals. If the save fails, remove it and show a toast.
- After adding, the column scrolls to the new card.

Default values for new cards: value 0, probability from the stage default, owner = the current user, pipeline and stage from the column.
