# Lumi environment isolation

> Issue: #53
> Статус: конфигурационный baseline и CI smoke; deployment credentials и фактические managed resources подставляются владельцем инфраструктуры.

## Правило

Dev, staging и production — три разных deployment boundaries. Они не делят Postgres, Redis, object-storage bucket, secret namespace, API endpoint или WebSocket endpoint. Если среды делят хоть один из этих ресурсов, это не три окружения, а один инцидент с разными `.env`.

Матрица живёт в `deploy/environments/*.json`. В manifest-файлах нет секретов и connection strings: только безопасные resource identifiers, public endpoints и ссылки на secret manager paths. Реальные значения `DATABASE_URL`, `REDIS_URL`, JWT secrets, storage credentials и provider keys выдаются deploy job из secret manager с environment-scoped permissions.

| Среда | Namespace | Postgres | Redis | Storage | API | WebSocket | Secrets |
| --- | --- | --- | --- | --- | --- | --- | --- |
| development | `lumi-dev` | `postgres/lumi-dev` | `redis/lumi-dev` | `lumi-dev-private` | `http://localhost:3000` | `ws://localhost:3000/realtime` | `local://backend/.env.local` |
| staging | `lumi-staging` | `postgres/lumi-staging` | `redis/lumi-staging` | `lumi-staging-private` | `https://api.staging.example.invalid` | `wss://api.staging.example.invalid/realtime` | `secret-manager://lumi/staging/*` |
| production | `lumi-production` | `postgres/lumi-production` | `redis/lumi-production` | `lumi-production-private` | `https://api.example.invalid` | `wss://api.example.invalid/realtime` | `secret-manager://lumi/production/*` |

`.invalid` endpoints intentionally mark placeholders: they must be replaced in the deployment system before staging/production traffic. They are not production claims.

## Backend environment

The backend receives one environment's values only. Required runtime secrets: `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`. Optional provider credentials are also environment-scoped. `DEPLOY_ENV`, `BUILD_SHA` and `API_VERSION` are non-secret metadata and are logged/returned only as sanitized health metadata.

The process must fail closed if a staging deployment is given production resources or if production secrets are referenced by a staging job. CI's `verify-environment-isolation.mjs` checks the committed matrix; the deployment platform must enforce the same namespace and secret policies at IAM/network level.

## Client builds

Expo receives only `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_WEBSOCKET_URL`. These are intentionally public and can be embedded in a mobile bundle. No `DATABASE_URL`, Redis URL, provider key, JWT secret, storage credential or arbitrary `process.env` is passed to `app.config.js`. Each build records the environment and build SHA separately from the endpoint values.

## CI and credentials

- Pull requests use ephemeral CI Postgres/Redis services, never staging or production.
- Deploy jobs must use GitHub Environments named `staging` and `production`, with separate secret sets and protected production approvals.
- A staging job may read only `secret-manager://lumi/staging/*`; a production job may read only `secret-manager://lumi/production/*`.
- CI must never print resolved secrets or connection strings.
- Migrations run as a separate, environment-scoped job before API traffic.
- The smoke artifact records environment name, commit/build SHA, API version, resource identifiers and health result, but not credentials or user data.

## Evidence

`node scripts/verify-environment-isolation.mjs` proves all three manifest rows are present and resource identifiers are unique. `node scripts/verify-client-config.mjs` proves the client config references only the two public endpoint variables and that each manifest has a distinct endpoint pair. This is repository/CI evidence; staging isolation still requires a deploy smoke against real managed resources before #53 is closed.
