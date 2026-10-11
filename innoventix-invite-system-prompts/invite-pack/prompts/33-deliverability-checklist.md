# 33: Deliverability checklist (documentation and DNS, no code)

Write docs/email-deliverability.md with these steps for the From domain:
1. SPF record including the sending provider.
2. DKIM record from the provider.
3. DMARC record starting at p=none.
4. A reply-to address that a real person reads.
5. Test by sending to Gmail and Outlook accounts; check spam folder and the "original message" headers.

Note: if you use the mailcow server on Contabo as SMTP, its SPF and DKIM must be set up for the same domain. A transactional provider such as Resend is simpler to get delivered.

Antigravity should write the file only. The owner does the DNS work.
