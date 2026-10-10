# 32 - Won and lost flow

Make closing deals feel deliberate.

- Moving a card into a won stage: no prompt, the card turns green with a "Won" badge, closed_at is set, and a confetti-free subtle success toast shows.
- Moving a card into a lost stage: a dialog asks for the lost reason. Options: Price, Competitor, No budget, No response, Timing, Other (with a text field). Reason is required (the server enforces this too, from prompt 14).
- Reopen: a won or lost card can be moved back to an open stage. It shows "Reopened" in activity.
- The board has a small "Won this month" and "Lost this month" count in the header.

Add a "Lost reasons" summary to the forecast view (prompt 34).
