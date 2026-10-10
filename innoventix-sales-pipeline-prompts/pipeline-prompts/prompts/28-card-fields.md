# 28 - Card fields: value, probability, dates, owner, client

In the card detail sidebar, add these fields with clean inline editors:

- Value: number input with currency selector (USD, EUR, GBP, PKR, AED, and others from the existing currency list). Formats with thousands separators.
- Probability: a slider 0 to 100 with a number label. Default comes from the stage (you can add a default probability to stages in a later pass).
- Expected close date: date picker. Overdue dates show in red.
- Owner: select from organization members, with avatar and name.
- Client: searchable select from the existing clients table. Include "Create client" if the existing clients module supports it. Do not duplicate client logic.
- Description: multiline, saves on blur.

On the board, the total for each column is the sum of value times probability as "weighted", and the raw sum as "total". Show both in the column header tooltip.
