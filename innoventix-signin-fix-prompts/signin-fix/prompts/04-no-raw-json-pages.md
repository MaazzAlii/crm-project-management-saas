# 04: API errors never show as raw JSON pages

Problem: the 429 JSON was displayed as the browser page.

Rules:
1. Any form or button on a page must use fetch() to call the API and show errors inside the page. Never use a plain HTML form action that points to an API route.
2. Search for: <form action="/api, form action="/api/auth, and window.location to any /api path. Fix each one.
3. If a browser navigates directly to an API route with GET (for example by typing the URL), return a redirect to the matching page, not JSON. Only for routes that are meant for browsers; webhooks and JSON APIs keep JSON.
4. The login page must show: "Too many attempts. Try again in N seconds." using retryAfterSeconds from the response, and must keep the form usable after the countdown.

Test: submit the login form with a wrong password five times. The page stays on /login and shows an inline message each time.
