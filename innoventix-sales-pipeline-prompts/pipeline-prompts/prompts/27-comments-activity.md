# 27 - Comments and activity feed

In the card detail, add a combined "Activity" section like Trello.

- A comment box at the top: text area with "Write a comment..." and a Save button. Ctrl or Cmd+Enter submits.
- Comments show author name, avatar, time ago ("2h ago", with the exact time on hover), and body text (plain text, with URLs made clickable and escaped to prevent HTML injection).
- Authors can edit or delete their own comments. Admins can delete any comment. Deleted comments are removed from view.
- Below comments, the activity list from prompt 09 (for example "Maaz moved this card from Lead to Qualified, 3m ago").
- Toggle buttons: "Show comments only" and "Show all activity".
- Paginate the activity list with "Load more".

Sanitize all text on render. Never use dangerouslySetInnerHTML for user content.
