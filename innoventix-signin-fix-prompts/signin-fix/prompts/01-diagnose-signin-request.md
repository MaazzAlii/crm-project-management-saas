# 01: Diagnose the Sign In request (no code changes)

Goal: find out which request the Sign In button sends and which route returns RATE_LIMIT_EXCEEDED.

1. Find the Sign In button on the landing page (src of the landing component) and the login page form. Record the element, its handler, and the URL it posts or fetches.
2. Run: grep -rn "RATE_LIMIT_EXCEEDED" app lib components
   List each file and what triggers it.
3. Run: grep -rn "verify-email/send\|verifyEmailSend\|send-verification" app lib components
   List every caller. Explain why each one exists.
4. Check whether the login page or landing page calls verify-email/send automatically (on mount, on submit, or in a useEffect). If yes, quote the exact line.
5. Check the login route: does it return a 429 with a "verification email" message? If so, quote the line.
6. Write docs/signin-diagnosis.md with: request method, URL, caller file and line, response code, and the one sentence explaining why the request is sent.

Output the diagnosis as a table. Do not change code in this step.
