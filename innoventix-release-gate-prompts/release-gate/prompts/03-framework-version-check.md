# 03: Framework version check

1. Run: node -p "require('./package.json').dependencies.next" and grep '"version"' node_modules/next/package.json
2. Report the installed version. Report whether cookies() and headers() are used with or without await across app/ and lib/. Use grep -rn "cookies()\|headers()" app lib middleware.ts.
3. For Next 14: cookies() and headers() are synchronous. For Next 15: they are async. Mark each call site as correct, incorrect, or wrapped in a try/catch that hides errors.
4. List every try/catch around cookies() or headers(). Each one hides errors and must be reported.
5. Confirm the production build log says the same version.

No code changes. Report the table.
