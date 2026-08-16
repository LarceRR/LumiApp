# MVP acceptance scenario

> Issue: #37  
> Sprint: S0  
> Status: specification added; staging execution and automated E2E are still pending.

## Goal

Проверить один сквозной путь Twilite от регистрации до появления общего момента у обоих участников:

`регистрация → создание пространства → приглашение партнёра → принятие приглашения → добавление момента → синхронизация → повторное открытие пространства через неделю`

Backend является источником истины. WebSocket используется только для доставки изменения, а повторная загрузка пространства и поверхности через HTTP должна вернуть тот же результат.

## Preconditions

- Доступен staging API с отдельной базой и Redis.
- Созданы два новых тестовых email-адреса: `owner` и `partner`.
- У тестовых аккаунтов нет ранее созданных пространств и активных приглашений.
- Установлены сборки iOS и Android из одной staging-версии.
- Зафиксированы часовой пояс и идентификатор версии приложения.
- Тест запускается с включённым логированием request id, но без текстов пользовательских записей и токенов.

## Scenario

### 1. Регистрация владельца

1. Открыть приложение без активной сессии.
2. Ввести уникальные `displayName`, email владельца и пароль.
3. Отправить форму регистрации.

Expected:

- `POST /v1/auth/sign-up` возвращает активную сессию с access и refresh token.
- Приложение сохраняет сессию и открывает список пространств.
- Созданное backend пространство владельца отображается только владельцу.
- Повторная отправка формы с тем же email не создаёт второй аккаунт и возвращает стабильную ошибку валидации/конфликта.

### 2. Создание общего пространства

1. Создать пространство с названием `Twilite MVP test <run-id>`.
2. Обновить список пространств через HTTP.
3. Открыть созданное пространство.

Expected:

- `POST /v1/spaces` возвращает идентификатор пространства и владельца.
- `GET /v1/spaces` содержит созданное пространство ровно один раз.
- Владелец имеет право `space.view`, `space.invite` и `surfaceObject.create`.
- Нельзя выбрать владельца, роль или права из клиентского payload: они определяются backend по текущей сессии.

### 3. Приглашение партнёра

1. Из общего пространства пригласить email партнёра.
2. Выйти из аккаунта владельца.
3. Зарегистрировать партнёра или войти под уже созданным тестовым аккаунтом.
4. Открыть список ожидающих приглашений.
5. Принять приглашение.

Expected:

- `POST /v1/spaces/{spaceId}/invitations` создаёт приглашение для нужного email.
- `GET /v1/spaces/invitations/pending` показывает приглашение только адресату.
- `POST /v1/spaces/invitations/{invitationId}/respond` с `{ "accept": true }` переводит приглашение в принятое состояние.
- После принятия `GET /v1/spaces` у партнёра содержит общее пространство.
- Владелец и партнёр видят пространство, но не получают прав сверх выданных.
- Повторное принятие того же приглашения не создаёт второго membership и возвращает корректный конфликт/текущее состояние.

### 4. Добавление момента

1. Войти владельцем или партнёром.
2. Открыть общее пространство.
3. Добавить хороший момент с заметкой `Первый общий момент <run-id>`.
4. Дождаться ответа API.
5. Повторить тот же mutation request с тем же idempotency key, если клиентский контракт его поддерживает.

Expected:

- `POST /v1/spaces/{spaceId}/surface-objects` создаёт один объект нужного `kind`.
- Координаты/ячейка выбираются сервером, клиент не может занять произвольную ячейку.
- Ответ содержит объект, автора, время, состояние и `version`.
- Повторная отправка retryable mutation не создаёт дубликат; результат повторного запроса совпадает с первоначальным либо backend возвращает стабильный конфликт по политике идемпотентности.
- Пользователь без `surfaceObject.create` получает отказ, а не объект.

### 5. Синхронизация второго устройства

1. Оставить владельца на экране пространства.
2. Открыть то же пространство на устройстве партнёра.
3. Создать момент на одном устройстве.
4. Проверить появление объекта на втором устройстве через realtime.
5. Отключить WebSocket на втором устройстве и обновить данные через HTTP.

Expected:

- WebSocket доставляет событие в пространство только авторизованным участникам.
- Объект появляется на втором устройстве без ручного обхода.
- После отключения WebSocket HTTP-запрос поверхности восстанавливает актуальное состояние.
- Никакой UI-state или realtime event не считается источником истины вместо ответа API.
- При повторной доставке события объект не дублируется.

### 6. Повторное открытие через неделю

1. Сохранить идентификатор пространства и объекта.
2. На staging переместить время теста на семь дней вперёд либо дождаться контрольного окна.
3. Повторно войти владельцем и открыть пространство.
4. Открыть timeline/history.

Expected:

- Пространство и момент доступны после новой сессии.
- Автор, дата, тип и состояние момента совпадают с backend.
- Объект, который должен тускнеть по доменной политике, получает состояние, рассчитанное backend, а не клиентскими часами.
- Timeline и surface согласованы по идентификатору и версии объекта.

## Idempotency and source-of-truth contract

| Mutation              | Retry policy                                                                                 | Source of truth          |
| --------------------- | -------------------------------------------------------------------------------------------- | ------------------------ |
| Registration          | Same email is a conflict; no duplicate user                                                  | HTTP response + database |
| Create space          | Client retries must not create an unintended duplicate; final policy must be explicit in API | HTTP response + database |
| Invite member         | Same active invitation is reused or returns a stable conflict                                | HTTP response + database |
| Accept invitation     | Repeating the request is safe and does not duplicate membership                              | HTTP response + database |
| Create surface object | Same idempotency key returns the original result                                             | HTTP response + database |
| Realtime delivery     | Duplicate events are ignored; missed events are recovered over HTTP                          | HTTP response + database |

If a mutation does not yet accept an idempotency key, the E2E test must record that as a failing contract item rather than silently treating a successful first request as proof of retry safety.

## Automation

The scenario should become a staging smoke test with two isolated users and two app sessions. The repository currently has backend integration boot coverage, but no configured mobile E2E runner, staging credentials, or stable test-data reset for this flow. Therefore the automated criterion is explicitly blocked until those prerequisites are added; a manual staging run must not be reported as automated coverage.

Minimum automation assertions:

1. Sign up owner and partner.
2. Create a shared space and accept an invitation.
3. Create one moment and assert exactly one object after a retry.
4. Read the surface over HTTP from the partner session.
5. Verify unauthorized access and missing permission cases.
6. Reconnect/reload and assert the same object id and version.

## Execution record

Fill this section only after a real staging run:

- Run id:
- Staging build/API version:
- iOS result:
- Android result:
- Realtime result:
- Retry/idempotency result:
- HTTP recovery result:
- Known failures:
- Evidence links:
