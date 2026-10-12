# 05: Rate limit policy (after the trigger is removed)

Keep the limits, but scope them correctly:
- Login: 10 attempts per email per 15 minutes, and 50 per IP per 15 minutes. Failed attempts count; a successful login resets the email counter.
- Verification email send: 1 per 60 seconds per user, only when the user clicks the send button.
- Invitation create: as already specified (20 per hour per user).

Responses:
- Return 429 with Retry-After and retryAfterSeconds in the JSON body.
- Message text is generic for login ("Too many attempts. Try again later."). Only verification shows "Please wait N seconds before requesting another email."

Tests: 11th login attempt returns 429; a successful login after 3 failures resets the counter; a verification send within 60 seconds returns 429 with the countdown.
