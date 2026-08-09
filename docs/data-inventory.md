# Lumi data inventory

> Issue: #39
> Версия: 1.1
> Scope: данные, которые Lumi собирает, создаёт, хранит или передаёт
> Проверенные источники: схема БД и миграции, границы модулей, конфигурация окружения бэкенда и клиента, зависимости мобильного приложения, MVP-сценарий

## Status

Это версионируемый инвентарь для работ по приватности, retention, удалению и раскрытиям в сторах. Он описывает текущую модель репозитория, а не правовой вывод. **Проверка реальных логов и подтверждение production-провайдеров остаются открытыми пунктами** и не считаются выполненными этим документом.

Связанные документы: `docs/foundation-contracts.md` (#28) задаёт инварианты владения, идемпотентности и правила `ON DELETE`, на которые опирается модель удаления; продуктовые и ресурсные лимиты фиксируются в #38; retention и deletion — в #40.

## Storage and processing map

| Category | Data fields / minimum set | Source and purpose | Storage / retention owner | External processors or transfer | Current status |
| --- | --- | --- | --- | --- | --- |
| Account identity | `userId`, email, display name, optional avatar URL, created/updated timestamps | Sign-up, sign-in, membership display and account lifecycle | Postgres `users`; `users` cascade owns deletion | None declared in repository | Implemented in schema; retention period not defined |
| Authentication credentials | Password hash only, never the password | Authenticate the user without storing plaintext credentials | Postgres `user_credentials`; auth module owns deletion | None declared | Implemented; hashing and log redaction require runtime verification |
| Sessions and device metadata | Session id, refresh-token hash, platform, optional device model, app version, creation/use/expiry/revocation timestamps | Refresh-token rotation, session listing, revocation and abuse investigation | Postgres `sessions`; auth module owns expiry and deletion | None declared | Implemented; retention after expiry is not defined |
| Age and territory declaration | Календарная дата рождения либо флаг «порог пройден», территория, версия политики | Возрастная и территориальная политика (#41) до создания профиля | Postgres `users` либо отдельная таблица — решается в #40 и #80 | None | **Решение принято (#41), хранение не реализовано.** Политика требует минимума: флаг и версия, если нет бизнес-необходимости в дате |
| User preferences | Locale, sound, haptics, reduce-motion, push enabled, extensible preference JSON | Personalize UX and notification behavior | Postgres `user_preferences`; settings module owns deletion | None declared | Implemented; `extra` requires field-level review before storing new data |
| Space and membership data | Space id, type, title, owner id, member id, role, permissions, joined time and optimistic-lock version | Create a shared space and enforce visibility/authorization | Postgres `spaces`, `space_members`; spaces module owns deletion | None declared | Implemented; retention follows account/space deletion policy, not yet specified |
| Invitation data | Invitation id, space id, inviter id, invitee email, optional invitee user id, permissions, status, created/responded timestamps | Invite a partner and process acceptance/rejection | Postgres `invitations`; spaces module owns deletion | Email delivery is not configured in the current repository | Implemented; pending and historical invitation retention not defined |
| Surface objects and moments | Object id, space/surface ids, kind, state, author id, subject user id, metadata JSON, favorite flag, cell coordinates, created/updated timestamps and version | Store good/difficult moments, render the surface, timeline and state transitions | Postgres `surfaces`, `surface_objects`; surface-objects module owns deletion | None declared | Implemented; metadata is user-generated and requires schema/PII limits |
| Timeline and activity | Event id, monotonic sequence, space id, event type, optional actor/subject ids, payload JSON and timestamp | History, audit-like product timeline and recovery pagination | Postgres `timeline_events`; timeline module owns deletion | None declared | Implemented; payload minimization and retention not defined |
| Media metadata and files | Asset id, owner/space ids, kind, storage key, content type, byte size, upload status and timestamps; file bytes are not in Postgres | Attach image/audio or other media to a user action | Postgres `media_assets` plus S3-compatible object storage configured by `STORAGE_*`; media module owns deletion | Cloudflare R2 is the configured target when enabled; exact region/transfer is deployment-dependent | Schema and adapter boundary exist; limits, private URL policy and retention are open |
| Push notification data | Device token, platform, first/last seen timestamps; notification type, payload, read timestamp | Deliver and track notifications | Postgres `device_tokens`, `notifications`; notifications module owns deletion | Push provider is not named in current repository | Schema exists; provider, payload minimization and retention are open |
| AI input and output | AI insight id, space/requesting user ids, status, summary, suggestions, model, context JSON and timestamps | Generate and explain an AI insight for a space | Postgres `ai_insights`; AI module owns deletion | AI provider receives request data when `AI_PROVIDER_API_KEY` is configured; model defaults to `gpt-4o-mini` | Schema exists; consent, training use, provider region and retention are open |
| Billing and subscription data | Product id, store, status, period end, entitlement key/source/expiry; webhook external id, raw payload and processing timestamps | Resolve entitlements and replay store callbacks | Postgres `subscriptions`, `entitlements`, `billing_webhook_events`; billing module owns deletion/retention policy | RevenueCat/store webhook payloads when billing is enabled | Schema exists; raw webhook minimization and legal retention are open |
| **Idempotency replay records** | `scope`, idempotency key, SHA-256 request hash, **сохранённый канонический ответ API**, HTTP-статус, created/expires timestamps | Безопасный повтор мутаций: регистрация, создание пространства, приглашения, моменты, экспорт, удаление, billing webhooks | Postgres `idempotency_records`; владелец `shared/idempotency`; TTL 24 часа, чистка отдельной операционной задачей | None | **Пропущено в версии 1.0.** `response` содержит тот же payload, что и ответ API, то есть может содержать персональные данные и содержимое момента. Таблица не связана FK с `users`, поэтому удаление аккаунта её не каскадирует — обязательный вход для #40 и #74 |
| Product analytics | Optional user id, event name, JSON properties and event timestamp | Measure activation, retention and product behavior without content | Postgres `analytics_events` when backend analytics is used; analytics module owns retention | PostHog SDK присутствует в графе зависимостей мобильного приложения (`posthog-react-native`); destination и набор полей требуют подтверждения | Schema/dependency exists; content-free allowlist and log review are open |
| Security audit data | Optional actor id, action, resource, resource id, context JSON and timestamp | Investigate permission changes, deletions and other security events | Postgres `audit_log`; security/application boundary owns retention | None declared | Schema exists; context allowlist and retention are open |
| **Redis: кеш, очереди, счётчики** | Кешированные проекции данных пространства, payload задач BullMQ (могут содержать идентификаторы и метаданные пользователя), счётчики rate limit по ключу пользователя или адреса | Ускорение чтений, фоновая обработка, throttling | Redis по `REDIS_URL`; владелец — модуль, который положил ключ | None declared; регион зависит от развёртывания | **Пропущено в версии 1.0.** Redis — отдельный слой хранения персональных данных: удаление аккаунта обязано затрагивать кеш, очереди и сессионные ключи (#74) |
| **Backups** | Полные копии Postgres, включая все категории выше | Восстановление после сбоя (#68) | Владелец бэкапов — операционная роль; расписание и retention задаются в #68 | Зависит от провайдера бэкапов | **Пропущено в версии 1.0.** Бэкап не удаляется по запросу пользователя мгновенно: политика удаления обязана описать окно расхождения (#40, #74) |
| Operational telemetry | Request/trace metadata, service health, error and performance signals | Operate API, database, Redis, queues and realtime | Application logs and configured Sentry DSN; exact sink depends on deployment | Sentry when `SENTRY_DSN` is enabled: бэкенд `@sentry/node`, клиент `@sentry/react-native` | Configuration exists; redaction must be verified from captured logs |
| Network and client metadata | IP address, user agent, request id, device/push id where collected by framework or provider | Security, rate limiting, diagnostics and push delivery | No dedicated Postgres field found; may exist in logs/provider systems | Hosting, Sentry or push provider only if enabled/configured | Collection and retention are not yet documented; do not assume absent |

## Данные на устройстве пользователя

Инвентарь не заканчивается на сервере: часть персональных данных живёт в клиенте, и её обязаны учитывать logout, удаление аккаунта и раскрытия в сторах.

| Хранилище | Что там оказывается | Зачем | Что требуется |
| --- | --- | --- | --- |
| `expo-secure-store` | Access/refresh токены | Сохранение сессии между запусками | Очистка при logout, смене пароля и удалении аккаунта (#58, #73) |
| `@react-native-async-storage/async-storage` и кеш React Query | Проекции ответов API: моменты, история, профиль партнёра | Offline-чтение и быстрый старт | Полная очистка при logout и при смене пользователя; кеш не должен переживать выход (#99) |
| Файловый кеш `expo-file-system` и `expo-audio` | Загруженные и записанные медиафайлы, временные аудиофайлы | Просмотр и запись медиа | Удаление временных файлов после подтверждённой загрузки и при logout |
| `posthog-react-native` | События продуктовой аналитики с устройства | Метрики активации и удержания | Allowlist событий без пользовательского контента, согласованный с #101 |
| `@sentry/react-native` | Ошибки, breadcrumbs, контекст устройства | Диагностика падений клиента | Скраббинг PII, отсутствие токенов и текстов моментов в breadcrumbs (#62) |

## Регистр чувствительных полей

Поля ниже требуют отдельного обращения: это либо секреты, либо пользовательский контент, либо данные о частной жизни. Ни одно из них не должно попадать в аналитику, логи, Sentry и метрики.

| Поле | Класс | Режим удаления при удалении аккаунта |
| --- | --- | --- |
| `user_credentials.password_hash` | Секрет аутентификации | `ON DELETE cascade` от `users` |
| `sessions.refresh_token_hash` | Секрет аутентификации | `ON DELETE cascade` от `users` |
| `users.email` | Идентификатор личности | `cascade`; учесть копию в `invitations.invitee_email` |
| `invitations.invitee_email` | Идентификатор личности третьего лица | `cascade` от `spaces`; собственного FK на `users` по email нет — риск остаточных данных |
| `surface_objects.metadata` | Пользовательский контент о частной жизни | `cascade` от `spaces` и от `users` |
| `timeline_events.payload` | Пользовательский контент и история | `cascade` от `spaces`; `actor_user_id` и `subject_user_id` — `set null`, то есть событие остаётся обезличенным |
| `ai_insights.context`, `ai_insights.summary`, `ai_insights.suggestions` | Производный контент от личных текстов | `cascade`; удаление на стороне провайдера — отдельный вопрос (#106, #107) |
| `media_assets.storage_key` и байты в объектном хранилище | Пользовательский контент | `cascade` в Postgres; файлы в хранилище удаляются отдельным шагом (#74) |
| `device_tokens.token` | Идентификатор устройства | `cascade` |
| `billing_webhook_events.payload` | Данные провайдера платежей | Собственного FK на `users` нет; retention определяется законом (#115) |
| `analytics_events.properties` | Потенциально контент, если allowlist не применён | `user_id` — `set null`; событие остаётся обезличенным |
| `audit_log.context` | Данные о действиях | `actor_user_id` — `set null` |
| `idempotency_records.response` | Копия ответа API, потенциально с контентом | **FK отсутствует**, удаляется только по TTL 24 часа — обязательный пункт для #74 |

## Minimum-data rules

- Never store plaintext passwords, access tokens or refresh tokens. Only credential hashes and refresh-token hashes belong in the database.
- Do not put moment text, audio bytes, AI prompts, raw payment data or push tokens into analytics events, request logs, Sentry breadcrumbs or error messages.
- Treat `metadata`, timeline `payload`, AI `context`, notification `payload`, billing webhook `payload`, analytics `properties`, audit `context` and `idempotency_records.response` as user- or provider-controlled JSON. Each producer must use an explicit allowlist and size limit (#38, #61).
- Client-provided ownership, role, subscription and visibility claims are not authoritative. Resolve them from the authenticated session and backend records.
- Media bytes must remain in private object storage and be accessed through short-lived URLs after authorization.
- Configuration errors and startup failures must report variable names only, never environment values (`docs/foundation-contracts.md`).

## Responsible backend components

| Data family | Authoritative component |
| --- | --- |
| Identity, credentials, sessions | `auth`, `users` |
| Age and territory decision | `shared/policy` (#41); enforcement in signup — #80 |
| Preferences | `settings` / user-preferences boundary |
| Spaces, memberships, invitations | `spaces` |
| Surface, moments, state and versions | `surfaces`, `surface-objects` |
| Timeline events | `timeline` |
| Media metadata and object storage lifecycle | `media` |
| Push devices and notifications | `notifications` |
| AI requests and insight history | `ai` |
| Subscriptions, entitlements and webhook replay | `billing` |
| Idempotency replay records | `shared/idempotency` |
| Product analytics and security audit trail | `analytics`, shared security boundary |
| Cache, queues and rate-limit counters | infrastructure boundary (Redis) |
| Logs, traces, health and error reporting | app/bootstrap and infrastructure boundaries |

## Telemetry verification checklist

Эти пункты **не проверены**. Их обязательно прогнать по логам staging и событиям Sentry до закрытия связанных privacy-задач:

- [ ] Access tokens, refresh tokens and authorization headers are absent.
- [ ] Passwords and password reset secrets are absent.
- [ ] Moment text and user-generated metadata are absent.
- [ ] Audio/image contents and private media URLs are absent.
- [ ] AI prompts, context and generated sensitive content are absent.
- [ ] Payment card data and unredacted provider payloads are absent.
- [ ] Push tokens and unnecessary device identifiers are absent.
- [ ] Analytics properties use an approved event/property allowlist.
- [ ] IP address, user agent and request identifiers have documented retention and access rules.
- [ ] Environment values and connection strings are absent from startup and error logs.

## Open decisions required for privacy and deletion work

1. Retention period for accounts, sessions, invitations, spaces, moments, timeline, media, AI history, analytics, audit logs, idempotency records and billing webhook records (#40).
2. Хранение возрастной декларации: дата рождения или только флаг и версия политики (#40, #80).
3. Hosting region and whether personal data of Russian residents is stored in Russia, including Redis and backups (#82).
4. Exact external providers and data-processing terms for object storage, AI, analytics, Sentry, push and billing (#78, #83).
5. Whether AI context and insight history are user-visible, exportable and deletable (#107).
6. Deletion order and recovery policy for database rows, object-storage files, Redis keys, queues, backups and third-party systems (#74).
7. Approved analytics event/property schema that excludes user-generated content (#101).
8. Судьба `invitations.invitee_email` и `idempotency_records.response` при удалении аккаунта: обе категории не покрыты каскадом от `users`.

## Completion evidence

To close #39, attach:

- A staging log/Sentry redaction check covering authentication, moment creation, AI, media and billing paths.
- The confirmed provider and region list.
- Approved retention values and deletion owners for every row, file and key category, включая Redis и бэкапы.
- A review showing privacy tasks and store disclosures reference this document.
