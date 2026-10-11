# 31: Development mode for email

When EMAIL_PROVIDER=console, print each email to the server log in a readable block with the accept link. This is the only place raw invite links appear in logs, and only in development.

Add a test that console mode throws if NODE_ENV is production.

Also add a page-free way to test: a script scripts/print-latest-invite.ts that prints the newest pending invite link from the local database for a given email. Do not commit real emails in the script.
