# 30 - Keyboard, touch, and auto-scroll

Make the board usable without a mouse and on phones.

Keyboard:
- Tab moves focus through cards in visible order. Enter opens a card.
- Space picks up a focused card for dragging (dnd-kit KeyboardSensor). Arrow Up and Down move within the column. Arrow Left and Right move to the adjacent column. Space or Enter drops, Escape cancels.
- Screen readers get announcements for pick up, move, and drop (use dnd-kit announcements).

Touch and mobile:
- Use TouchSensor with a 200ms delay so scrolling still works.
- On small screens, columns stack horizontally with snap scrolling. Show a column switcher at the top.

Auto-scroll:
- When dragging near the left or right edge of the board, scroll the board. When dragging near the top or bottom edge of a column, scroll that column.

Test with keyboard only and with a touch emulator in the browser dev tools.
