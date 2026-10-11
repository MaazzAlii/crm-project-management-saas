# 38: Signup with an invitation

On /signup?invite=... (or the token route from prompt 37):
- The email field is prefilled and locked to the invitation email.
- The organization name field is hidden. An invited user does not create a new workspace.
- After signup, email verification is sent (prompt 26) and the invite is accepted in the same flow. If verification is required before joining, say so in the UI and join immediately, marking the membership as unverified until the email is confirmed.

Choose one of the two behaviors above, state it in your report, and test it.
