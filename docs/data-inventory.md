# Lumi data inventory

> Issue: #39  
> Scope: data Lumi collects, creates, stores or sends  
> Source reviewed: backend database schema, module boundaries, runtime configuration and MVP scenario

## Status

This document is the versioned inventory for privacy, retention, deletion and store-disclosure work. It describes the current repository model, not a legal conclusion. Runtime log verification and production-provider confirmation remain open items.

## Storage and processing map

| Category | Data fields / minimum set | Source and purpose | Storage / retention owner | External processors or transfer | Current status |
| --- | --- | --- | --- | --- | --- |
| Account identity | `userId`, email, display name, optional avatar URL, created/updated timestamps | Sign-up, sign-in, membership display and account lifecycle | Postgres `users`; `users` cascade owns deletion | None declared in repository | Implemented in schema; retention period not defined |
| Authentication credentials | Password hash only, never the password | Authenticate the user without storing plaintext credentials | Postgres `user_credentials`; auth module owns deletion | None declared | Implemented; hashing and log redaction require runtime verification |
| Sessions and device metadata | Session id, refresh-token hash, platform, optional device model, app version, creation/use/expiry/revocation timestamps | Refresh-token rotation, session listing, revocation and abuse investigation | Postgres `sessions`; auth module owns expiry and deletion | None declared | Implemented; retention after expiry is not defined |
| User preferences | Locale, sound, haptics, reduce-motion, push enabled, extensible preference JSON | Personalize UX and notification behavior | Postgres `user_preferences`; settings module owns deletion | None declared | Implemented; `extra` requires field-level review before storing new data |
| Space and membership data | Space id, type, title, owner id, member id, role, permissions, joined time and optimistic-lock version | Create a shared space and enforce visibility/authorization | Postgres `spaces`, `space_members`; spaces module owns deletion | None declared | Implemented; retention follows account/space deletion policy, not yet specified |
| Invitation data | Invitation id, space id, inviter id, invitee email, optional invitee user id, permissions, status, created/responded timestamps | Invite a partner and process acceptance/rejection | Postgres `invitations`; spaces module owns deletion | Email delivery is not configured in the current repository | Implemented; pending and historical invitation retention not defined |
| Surface objects and moments | Object id, space/surface ids, kind, state, author id, subject user id, metadata JSON, favorite flag, cell coordinates, created/updated timestamps and version | Store good/difficult moments, render the surface, timeline and state transitions | Postgres `surfaces`, `surface_objects`; surface-objects module owns deletion | None declared | Implemented; metadata is user-generated and requires schema/PII limits |
| Timeline and activity | Event id, monotonic sequence, space id, event type, optional actor/subject ids, payload JSON and timestamp | History, audit-like product timeline and recovery pagination | Postgres `timeline_events`; timeline module owns deletion | None declared | Implemented; payload minimization and retention not defined |
| Media metadata and files | Asset id, owner/space ids, kind, storage key, content type, byte size, upload status and timestamps; file bytes are not in Postgres | Attach image/audio or other media to a user action | Postgres `media_assets` plus S3-compatible object storage configured by `STORAGE_*`; media module owns deletion | Cloudflare R2 is the configured target when enabled; exact region/transfer is deployment-dependent | Schema and adapter boundary exist; limits, private URL policy and retention are open |
| Push notification data | Device token, platform, first/last seen timestamps; notification type, payload, read timestamp | Deliver and track notifications | Postgres `device_tokens`, `notifications`; notifications module owns deletion | Push provider is not named in current repository | Schema exists; provider, payload minimization and retention are open |
| AI input and output | AI insight id, space/requesting user ids, status, summary, suggestions, model, context JSON and timestamps | Generate and explain an AI insight for a space | Postgres `ai_insights`; AI module owns deletion | AI provider receives request data when `AI_PROVIDER_API_KEY` is configured; model defaults to `gpt-4o-mini` | Schema exists; consent, training use, provider region and retention are open |
| Billing and subscription data | Product id, store, status, period end, entitlement key/source/expiry; webhook external id, raw payload and processing timestamps | Resolve entitlements and replay store callbacks | Postgres `subscriptions`, `entitlements`, `billing_webhook_events`; billing module owns deletion/retention policy | RevenueCat/store webhook payloads when billing is enabled | Schema exists; raw webhook minimization and legal retention are open |
| Product analytics | Optional user id, event name, JSON properties and event timestamp | Measure activation, retention and product behavior without content | Postgres `analytics_events` when backend analytics is used; analytics module owns retention | PostHog SDK is present in the mobile dependency graph; deployment destination and fields require confirmation | Schema/dependency exists; content-free allowlist and log review are open |
| Security audit data | Optional actor id, action, resource, resource id, context JSON and timestamp | Investigate permission changes, deletions and other security events | Postgres `audit_log`; security/application boundary owns retention | None declared | Schema exists; context allowlist and retention are open |
| Operational telemetry | Request/trace metadata, service health, error and performance signals | Operate API, database, Redis, queues and realtime | Application logs and configured Sentry DSN; exact sink depends on deployment | Sentry when `SENTRY_DSN` is enabled | Configuration exists; redaction must be verified from captured logs |
| Network and client metadata | IP address, user agent, request id, device/push id where collected by framework or provider | Security, rate limiting, diagnostics and push delivery | No dedicated Postgres field found; may exist in logs/provider systems | Hosting, Sentry or push provider only if enabled/configured | Collection and retention are not yet documented; do not assume absent |

## Minimum-data rules

- Never store plaintext passwords, access tokens or refresh tokens. Only credential hashes and refresh-token hashes belong in the database.
- Do not put moment text, audio bytes, AI prompts, raw payment data or push tokens into analytics events, request logs, Sentry breadcrumbs or error messages.
- Treat `metadata`, timeline `payload`, AI `context`, notification `payload`, billing webhook `payload`, analytics `properties` and audit `context` as user- or provider-controlled JSON. Each producer must use an explicit allowlist and size limit.
- Client-provided ownership, role, subscription and visibility claims are not authoritative. Resolve them from the authenticated session and backend records.
- Media bytes must remain in private object storage and be accessed through short-lived URLs after authorization.

## Responsible backend components

| Data family | Authoritative component |
| --- | --- |
| Identity, credentials, sessions | `auth`, `users` |
| Preferences | `settings` / user-preferences boundary |
| Spaces, memberships, invitations | `spaces` |
| Surface, moments, state and versions | `surfaces`, `surface-objects` |
| Timeline events | `timeline` |
| Media metadata and object storage lifecycle | `media` |
| Push devices and notifications | `notifications` |
| AI requests and insight history | `ai` |
| Subscriptions, entitlements and webhook replay | `billing` |
| Product analytics and security audit trail | `analytics`, shared security boundary |
| Logs, traces, health and error reporting | app/bootstrap and infrastructure boundaries |

## Telemetry verification checklist

The following must be checked against staging logs and Sentry events before marking issue #39 complete:

- [ ] Access tokens, refresh tokens and authorization headers are absent.
- [ ] Passwords and password reset secrets are absent.
- [ ] Moment text and user-generated metadata are absent.
- [ ] Audio/image contents and private media URLs are absent.
- [ ] AI prompts, context and generated sensitive content are absent.
- [ ] Payment card data and unredacted provider payloads are absent.
- [ ] Push tokens and unnecessary device identifiers are absent.
- [ ] Analytics properties use an approved event/property allowlist.
- [ ] IP address, user agent and request identifiers have documented retention and access rules.

## Open decisions required for privacy and deletion work

1. Retention period for accounts, sessions, invitations, spaces, moments, timeline, media, AI history, analytics, audit logs and billing webhook records.
2. Whether Lumi supports minors and users outside Russia.
3. Hosting region and whether personal data of Russian residents is stored in Russia.
4. Exact external providers and data-processing terms for object storage, AI, analytics, Sentry, push and billing.
5. Whether AI context and insight history are user-visible, exportable and deletable.
6. Deletion order and recovery policy for database rows, object-storage files, queues, backups and third-party systems.
7. Approved analytics event/property schema that excludes user-generated content.

## Completion evidence

To close #39, attach:

- A staging log/Sentry redaction check covering authentication, moment creation, AI, media and billing paths.
- The confirmed provider and region list.
- Approved retention values and deletion owners for every row/file category.
- A review showing privacy tasks and store disclosures reference this document.
