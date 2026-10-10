# 35 - Keep the board in sync across users

Two people looking at the same pipeline should see each other's moves.

Implementation (keep it simple and reliable):
- Poll the board endpoint every 15 seconds while the tab is visible. Pause when hidden. Use the version numbers to merge: keep local optimistic changes that are still pending, and take server data for everything else.
- Refresh immediately on window focus.
- Show a small "Updated just now" indicator in the header.
- If a card you are editing changed on the server, show a banner: "Updated by someone else" with a Reload button. Do not overwrite your open text.

Do not add websockets in this prompt. Note in the handover doc that websockets can be added later.
