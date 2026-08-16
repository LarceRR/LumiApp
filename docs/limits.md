# Twilite product and resource limits

> Issue: #38
> Версия: 1.0
> Источник правды: `backend/src/config/limits.ts` (реестр `LIMIT_DEFINITIONS`)

## Правила

1. **Ни один лимит не является клиентской константой.** Клиент может показать счётчик символов или подсказку, но решение принимает бэкенд. Если лимита нет на сервере, его нет вообще.
2. **Каждый лимит имеет единицу измерения.** «2000» без единицы — это баг: символы, байты, элементы, секунды, миллисекунды, запросы за окно и бюджет различаются.
3. **Каждый лимит настраивается переменной окружения** из таблицы ниже, поэтому значение меняется без релиза клиента. Значение по умолчанию равно production-значению.
4. **Fail closed.** Пустое, нецелое, нечисловое или выходящее за диапазон значение — ошибка старта процесса, а не тихий фолбэк.
5. **Проверка лимита идёт до бизнес-операции, до вызова внешнего провайдера и до idempotent replay.** Иначе повторный запрос с тем же idempotency key вернул бы сохранённый ответ и обошёл лимит.
6. **Отказ по лимиту стабилен и безопасен**: `400 VALIDATION_FAILED` с `details.violations[]`, где указаны поле, фактический размер, предел и единица. Пользовательский текст, payload и токены в ответ и логи не попадают.
7. Лимиты, ограничивающие частоту (`requests/*`) и бюджет, реализуются серверным enforcement в #59, #61, #63 и #104. Этот документ задаёт значения, а не факт их применения на каждом маршруте.

## Матрица лимитов

| Env-ключ                                   | Путь в `AppLimits`                      | Значение (prod) | Единица         | Диапазон        | Владелец           | Что защищает                                                  |
| ------------------------------------------ | --------------------------------------- | --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------- |
| `LIMIT_EMAIL_MAX_LENGTH`                   | `auth.emailMaxLength`                   | 254             | characters      | 32–320          | auth               | Длина email при регистрации и входе                           |
| `LIMIT_PASSWORD_MIN_LENGTH`                | `auth.passwordMinLength`                | 8               | characters      | 8–64            | auth               | Минимальная длина пароля; совпадает с текущим `auth.contract` |
| `LIMIT_PASSWORD_MAX_LENGTH`                | `auth.passwordMaxLength`                | 128             | characters      | 64–256          | auth               | Стоимость хеширования пароля                                  |
| `LIMIT_DISPLAY_NAME_MAX_LENGTH`            | `auth.displayNameMaxLength`             | 80              | characters      | 8–200           | auth               | Длина отображаемого имени                                     |
| `LIMIT_ACTIVE_SESSIONS_PER_USER`           | `auth.activeSessionsPerUser`            | 10              | items           | 1–100           | auth               | Число одновременных сессий                                    |
| `LIMIT_SIGN_IN_ATTEMPTS_PER_HOUR`          | `auth.signInAttemptsPerHour`            | 20              | requests/hour   | 3–1000          | auth               | Подбор пароля                                                 |
| `LIMIT_SIGN_UP_PER_IP_PER_HOUR`            | `auth.signUpPerIpPerHour`               | 5               | requests/hour   | 1–1000          | auth               | Массовая регистрация                                          |
| `LIMIT_PASSWORD_RESET_PER_EMAIL_PER_HOUR`  | `auth.passwordResetPerEmailPerHour`     | 3               | requests/hour   | 1–100           | auth               | Спам восстановлением доступа                                  |
| `LIMIT_SPACES_PER_USER`                    | `spaces.spacesPerUser`                  | 3               | items           | 1–50            | spaces             | Число пространств во владении                                 |
| `LIMIT_SPACE_TITLE_MAX_LENGTH`             | `spaces.titleMaxLength`                 | 80              | characters      | 8–200           | spaces             | Длина названия пространства                                   |
| `LIMIT_MEMBERS_PER_SPACE`                  | `spaces.membersPerSpace`                | 2               | items           | 2–10            | spaces             | MVP — пространство пары                                       |
| `LIMIT_PENDING_INVITATIONS_PER_SPACE`      | `invitations.pendingPerSpace`           | 1               | items           | 1–10            | spaces             | Согласовано с индексом `invitations_pending_unique`           |
| `LIMIT_INVITATIONS_PER_USER_PER_DAY`       | `invitations.perUserPerDay`             | 20              | requests/day    | 1–500           | spaces             | Рассылка приглашений                                          |
| `LIMIT_INVITATION_TTL_HOURS`               | `invitations.ttlHours`                  | 72              | hours           | 1–720           | spaces             | Срок жизни приглашения до `expired`                           |
| `LIMIT_MOMENT_TEXT_MAX_LENGTH`             | `moments.textMaxLength`                 | 2000            | characters      | 100–20000       | surface-objects    | Текст момента                                                 |
| `LIMIT_MOMENT_METADATA_MAX_BYTES`          | `moments.metadataMaxBytes`              | 8192            | bytes           | 512–262144      | surface-objects    | Размер `metadata` в JSON                                      |
| `LIMIT_MOMENT_METADATA_MAX_KEYS`           | `moments.metadataMaxKeys`               | 32              | items           | 4–200           | surface-objects    | Ключи верхнего уровня в `metadata`                            |
| `LIMIT_MOMENTS_PER_SPACE_PER_DAY`          | `moments.perSpacePerDay`                | 200             | requests/day    | 10–5000         | surface-objects    | Флуд моментами                                                |
| `LIMIT_OBJECTS_PER_SURFACE`                | `moments.objectsPerSurface`             | 500             | items           | 10–10000        | surfaces           | Стоимость рендера и снапшота поверхности                      |
| `LIMIT_REQUEST_BODY_MAX_BYTES`             | `http.requestBodyMaxBytes`              | 262144          | bytes           | 4096–5242880    | bootstrap          | Размер тела запроса                                           |
| `LIMIT_JSON_DEPTH_MAX`                     | `http.jsonDepthMax`                     | 8               | items           | 2–32            | bootstrap          | Глубина вложенности JSON                                      |
| `LIMIT_PAGE_SIZE_MAX`                      | `http.pageSizeMax`                      | 100             | items           | 10–500          | bootstrap          | Согласовано с `paginationQuerySchema`                         |
| `LIMIT_IDEMPOTENCY_KEY_MAX_LENGTH`         | `http.idempotencyKeyMaxLength`          | 200             | characters      | 32–512          | shared/idempotency | Длина idempotency key                                         |
| `LIMIT_IDEMPOTENCY_RECORD_TTL_HOURS`       | `http.idempotencyRecordTtlHours`        | 24              | hours           | 1–168           | shared/idempotency | Срок жизни записи `idempotency_records`                       |
| `LIMIT_MEDIA_IMAGE_MAX_BYTES`              | `media.imageMaxBytes`                   | 10485760        | bytes           | 65536–52428800  | media              | Размер изображения                                            |
| `LIMIT_MEDIA_AUDIO_MAX_BYTES`              | `media.audioMaxBytes`                   | 26214400        | bytes           | 65536–104857600 | media              | Размер аудиозаписи                                            |
| `LIMIT_MEDIA_AUDIO_MAX_SECONDS`            | `media.audioMaxSeconds`                 | 180             | seconds         | 5–3600          | media              | Длительность аудио и стоимость обработки                      |
| `LIMIT_MEDIA_UPLOADS_PER_USER_PER_DAY`     | `media.uploadsPerUserPerDay`            | 50              | requests/day    | 1–1000          | media              | Расход объектного хранилища                                   |
| `LIMIT_MEDIA_URL_TTL_SECONDS`              | `media.signedUrlTtlSeconds`             | 900             | seconds         | 60–86400        | media              | Срок жизни подписанной ссылки                                 |
| `LIMIT_AI_INPUT_MAX_CHARACTERS`            | `ai.inputMaxCharacters`                 | 8000            | characters      | 500–100000      | ai                 | Объём данных, уходящих провайдеру                             |
| `LIMIT_AI_REQUESTS_PER_USER_PER_MINUTE`    | `ai.requestsPerUserPerMinute`           | 3               | requests/minute | 1–60            | ai                 | Всплеск запросов к AI                                         |
| `LIMIT_AI_REQUESTS_PER_USER_PER_DAY`       | `ai.requestsPerUserPerDay`              | 20              | requests/day    | 1–1000          | ai                 | Суточное потребление AI                                       |
| `LIMIT_AI_PROVIDER_TIMEOUT_MS`             | `ai.providerTimeoutMs`                  | 20000           | milliseconds    | 1000–120000     | ai                 | Зависший вызов провайдера                                     |
| `LIMIT_AI_DAILY_BUDGET_USD_CENTS`          | `ai.dailyBudgetUsdCents`                | 500             | usd cents/day   | 1–1000000       | ai                 | Денежный расход; при исчерпании провайдер не вызывается       |
| `LIMIT_SUPPORT_MESSAGE_MAX_LENGTH`         | `privacy.supportMessageMaxLength`       | 4000            | characters      | 100–20000       | support            | Длина обращения в поддержку                                   |
| `LIMIT_SUPPORT_REQUESTS_PER_USER_PER_DAY`  | `privacy.supportRequestsPerUserPerDay`  | 5               | requests/day    | 1–100           | support            | Спам обращениями                                              |
| `LIMIT_EXPORT_REQUESTS_PER_USER_PER_DAY`   | `privacy.exportRequestsPerUserPerDay`   | 2               | requests/day    | 1–50            | privacy            | Стоимость экспорта данных                                     |
| `LIMIT_DELETION_REQUESTS_PER_USER_PER_DAY` | `privacy.deletionRequestsPerUserPerDay` | 5               | requests/day    | 1–50            | privacy            | Повторные запросы удаления (идемпотентны)                     |

## Уже существующие лимиты вне этого реестра

Эти значения заданы раньше и остаются в `src/config/env.ts`; дублировать их не нужно:

- `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` — время жизни токенов (#57);
- `DATABASE_POOL_MAX` — размер пула соединений;
- `SURFACE_SPAWN_RADIUS`, `SURFACE_AGE_AFTER_HOURS` — правила домена поверхности.

## Как это проверяется

- `backend/src/config/limits.spec.ts`: диапазоны, production-значения по каждому пути, переопределение через окружение, отказ на некорректном значении, отсутствие значений окружения в тексте ошибки и синхронизация этой таблицы с реестром в обе стороны.
- `backend/src/shared/limits/limits.guard.spec.ts`: граничное значение проходит, превышение отклоняется стабильным `VALIDATION_FAILED`, пользовательский текст не попадает в ответ, JSON ограничен по размеру/ключам/глубине и проверка лимита выполняется **до** idempotent replay.

## Что дальше

- #61 — серверная валидация размера, типа и содержания каждого user-controlled input по этим значениям.
- #59, #63 — enforcement частотных лимитов и защита от abuse.
- #104 — rate/size/budget для AI.
- #48 — обязательные поля момента ссылаются на значения из этой матрицы, а не на свои константы.
