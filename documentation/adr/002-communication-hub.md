# ADR 002: Communication Hub Architecture & Unified Inbox Data Layer

## Status
Accepted

## Context
The agency CRM SaaS platform requires a unified Communication Hub where messages across all supported channels (Slack, WhatsApp, Email, Discord, Upwork) are aggregated into a single thread view per client and a global agency inbox.

Different external platforms have distinct payload structures, authentication models, user identifiers, and message delivery contracts. Without a normalized data layer and robust ingestion pipeline, scaling integrations would lead to fragmented message storage, duplicate logic, and multi-tenant security vulnerabilities.

## Decision Drivers
1. **Multi-Tenant Security**: Organizations must never access messages from another tenant. The ingestion system must derive `organization_id` strictly from authenticated server-side channel registrations (`communication_channels`), ignoring any tenant identifiers passed in webhook bodies.
2. **Channel Normalization**: All external message formats (Slack event API, WhatsApp Cloud API, Email Webhooks, Discord Bot API, Upwork Webhooks) must map onto a uniform database entity (`communication_messages`).
3. **Automated Client Matching**: Inbound messages should automatically link to an existing client profile using email address or phone number matching. Unmatched messages must safely degrade to `client_id = null` for manual triage without dropping raw message data.
4. **Performance & Search**: Support fast querying across tenant inbox views with indexes on `(organization_id, sent_at DESC)` and `(client_id, sent_at DESC)`.

## Architecture & Data Flow

```
[ External Webhook / API ]
         │
         ▼
[ Provider Webhook Handler ]
         │ (extracts channel_id & payload)
         ▼
[ ingestMessage() Layer ]
         │ 1. Look up channel -> get verified organization_id
         │ 2. Normalize payload -> body, sender_name, sender_identifier, metadata
         │ 3. Match client -> query clients by email / phone
         ▼
[ communication_messages DB Table ]
         │
         ▼
[ Unified Inbox UI / Client Timeline ]
```

## Schema Contract (`communication_messages`)
- `id`: UUID (primary key)
- `organization_id`: UUID (foreign key -> `organizations`)
- `channel_id`: UUID (foreign key -> `communication_channels`)
- `client_id`: UUID (nullable foreign key -> `clients`)
- `direction`: `'inbound' | 'outbound'`
- `sender_name`: String (display name of sender)
- `sender_identifier`: String (normalized email / phone / Slack ID)
- `body`: Text (sanitized plain text / markdown body)
- `external_message_id`: String (provider ID for deduplication)
- `metadata`: JSONB (raw payload / provider headers / attachments)
- `sent_at`: Timestamptz
- `read_at`: Timestamptz (null if unread)

## Consequences

### Positive
- **Single Source of Truth**: Unified inbox and individual client timelines read from the same underlying table (`communication_messages`).
- **Extensible Integration Pipeline**: Adding new providers (e.g. Telegram or SMS) only requires defining a new provider webhook parser that calls `ingestMessage()`.
- **Zero-Trust Tenant Isolation**: Ingestion derives `organization_id` strictly from channel DB lookup.

### Negative
- Multi-provider payload storage relies on JSONB `metadata` which requires disciplined indexing if deep provider-specific metadata filtering is needed.
