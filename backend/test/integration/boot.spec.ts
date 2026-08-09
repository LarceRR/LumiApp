import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe.skipIf(process.env['RUN_INTEGRATION'] !== '1')('запуск приложения', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const { createApp } = await import('@/bootstrap/createApp');
    app = (await createApp()).app;
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  }, 60_000);

  afterAll(async () => { await app?.close(); });

  it('собирает граф зависимостей и отвечает на health', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', checks: { database: 'up', cache: 'up' } });
  });

  it('публикует OpenAPI со всеми основными маршрутами, если Swagger включён', async () => {
    if (process.env['ENABLE_SWAGGER'] !== 'true') return;
    const response = await app.inject({ method: 'GET', url: '/v1/docs-json' });
    const document = response.json() as { paths: Record<string, unknown> };
    expect(response.statusCode).toBe(200);
    for (const path of ['/v1/auth/sign-in', '/v1/spaces', '/v1/spaces/{spaceId}/surface', '/v1/spaces/{spaceId}/surface-objects', '/v1/spaces/{spaceId}/timeline', '/v1/surface-objects/{objectId}', '/v1/billing/state']) expect(Object.keys(document.paths)).toContain(path);
  });

  it('закрывает защищённые маршруты без токена', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/spaces' });
    expect(response.statusCode).toBe(401);
  });
});
