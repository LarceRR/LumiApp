import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * The MVP core scenario from `docs/mvp-core-scenario.md`, executed end to end
 * against the real application graph: sign-up -> shared space -> invitation ->
 * moment -> sync -> return. By the definition in the production readiness
 * checklist, a release is not ready while this file is red.
 *
 * It needs Postgres and Redis, so it is opt-in through `RUN_INTEGRATION=1` (set
 * in CI, where both run as services), exactly like `boot.spec.ts`.
 */

type Method = 'GET' | 'POST';

type Reply = { readonly statusCode: number; readonly body: unknown };

type AuthSession = {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly userId: string;
};

type SpaceMember = { readonly userId: string; readonly role: string };

type Space = {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly members: readonly SpaceMember[];
  readonly version: number;
};

type Invitation = {
  readonly id: string;
  readonly spaceId: string;
  readonly inviteeEmail: string;
  readonly status: string;
};

type SurfaceObject = {
  readonly id: string;
  readonly kind: string;
  readonly state: string;
  readonly cellX: number;
  readonly cellY: number;
  readonly createdByUserId: string;
  readonly subjectUserId: string;
  readonly version: number;
};

type SurfaceSnapshot = {
  readonly surface: { readonly id: string; readonly version: number };
  readonly objects: readonly SurfaceObject[];
};

type TimelinePage = {
  readonly events: readonly { readonly type: string }[];
};

type Statistics = {
  readonly totalObjects: number;
  readonly byKind: Record<string, number>;
};

/** Every run uses fresh emails: the test database is never reset between runs. */
const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const anna = {
  email: `lumi-mvp-${runId}-a@example.com`,
  password: 'lumi-partner-a-pass',
  displayName: 'Аня',
};

const boris = {
  email: `lumi-mvp-${runId}-b@example.com`,
  password: 'lumi-partner-b-pass',
  displayName: 'Борис',
};

const moment = { kind: 'Fire', metadata: { note: 'Принёс кофе без просьбы' } };

const step = 30_000;

describe.skipIf(process.env['RUN_INTEGRATION'] !== '1')('основной сценарий MVP', () => {
  let app: NestFastifyApplication;
  let annaSession: AuthSession;
  let borisSession: AuthSession;
  let space: Space;
  let invitation: Invitation;
  let object: SurfaceObject;

  beforeAll(async () => {
    const { createApp } = await import('@/bootstrap/createApp');
    app = (await createApp()).app;

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  const request = async (
    method: Method,
    url: string,
    token: string | null,
    payload: Record<string, unknown> | null,
  ): Promise<Reply> => {
    const response = await app.inject({
      method,
      url,
      ...(token === null ? {} : { headers: { authorization: `Bearer ${token}` } }),
      ...(payload === null ? {} : { payload }),
    });

    return {
      statusCode: response.statusCode,
      body: response.body.length === 0 ? null : response.json(),
    };
  };

  const get = (url: string, token: string): Promise<Reply> => request('GET', url, token, null);

  const post = (
    url: string,
    token: string | null,
    payload: Record<string, unknown>,
  ): Promise<Reply> => request('POST', url, token, payload);

  /** The timeline is a projection built by an async listener, so it is polled. */
  const timelineTypes = async (token: string, expected: readonly string[]): Promise<string[]> => {
    let seen: string[] = [];

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const reply = await get(`/v1/spaces/${space.id}/timeline?limit=50`, token);
      const page = reply.body as TimelinePage;
      seen = page.events.map((event) => event.type);

      if (expected.every((type) => seen.includes(type))) {
        return seen;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
    }

    return seen;
  };

  it(
    'шаги 1-2: регистрация создаёт аккаунт вместе с личным пространством',
    async () => {
      const first = await post('/v1/auth/sign-up', null, {
        ...anna,
        device: { platform: 'ios', model: 'iPhone 15', appVersion: '1.0.0' },
      });

      expect(first.statusCode).toBe(201);
      annaSession = first.body as AuthSession;
      expect(annaSession.accessToken.length).toBeGreaterThan(0);

      const second = await post('/v1/auth/sign-up', null, {
        ...boris,
        device: { platform: 'android', model: 'Pixel 8', appVersion: '1.0.0' },
      });

      expect(second.statusCode).toBe(201);
      borisSession = second.body as AuthSession;

      const listed = await get('/v1/spaces', annaSession.accessToken);
      const spaces = listed.body as readonly Space[];

      expect(listed.statusCode).toBe(200);
      expect(spaces).toHaveLength(1);
      expect(spaces[0]?.type).toBe('Personal');

      // Повторная регистрация не создаёт второй аккаунт.
      const repeated = await post('/v1/auth/sign-up', null, anna);

      expect(repeated.statusCode).toBe(409);
    },
    step,
  );

  it(
    'шаг 3: A создаёт общее пространство и остаётся его владельцем',
    async () => {
      const created = await post('/v1/spaces', annaSession.accessToken, { title: 'Мы' });

      expect(created.statusCode).toBe(201);
      space = created.body as Space;

      expect(space.type).toBe('Shared');
      expect(space.members).toHaveLength(1);
      expect(space.members[0]?.userId).toBe(annaSession.userId);
      expect(space.members[0]?.role).toBe('Owner');
    },
    step,
  );

  it(
    'шаги 4-5: приглашение создаётся один раз и видно получателю',
    async () => {
      const invited = await post(`/v1/spaces/${space.id}/invitations`, annaSession.accessToken, {
        email: boris.email,
      });

      expect(invited.statusCode).toBe(201);
      invitation = invited.body as Invitation;
      expect(invitation.status).toBe('Pending');

      // Повторная отправка того же приглашения не создаёт второе.
      const repeated = await post(`/v1/spaces/${space.id}/invitations`, annaSession.accessToken, {
        email: boris.email,
      });

      expect(repeated.statusCode).toBe(409);

      const pending = await get('/v1/spaces/invitations/pending', borisSession.accessToken);
      const invitations = pending.body as readonly Invitation[];

      expect(pending.statusCode).toBe(200);
      expect(invitations).toHaveLength(1);
      expect(invitations[0]?.id).toBe(invitation.id);
    },
    step,
  );

  it(
    'шаг 6: приглашение принимается один раз, участник не дублируется',
    async () => {
      const url = `/v1/spaces/invitations/${invitation.id}/respond`;
      const accepted = await post(url, borisSession.accessToken, { accept: true });

      expect(accepted.statusCode).toBe(201);
      expect((accepted.body as Invitation).status).toBe('Accepted');

      // Повторное принятие отклоняется, а членство остаётся единственным.
      const repeated = await post(url, borisSession.accessToken, { accept: true });

      expect(repeated.statusCode).toBe(409);

      const listed = await get('/v1/spaces', borisSession.accessToken);
      const shared = (listed.body as readonly Space[]).find((item) => item.id === space.id);

      expect(shared?.members).toHaveLength(2);
    },
    step,
  );

  it(
    'шаг 7: партнёр ставит момент, адресат и координаты решает сервер',
    async () => {
      const created = await post(
        `/v1/spaces/${space.id}/surface-objects`,
        borisSession.accessToken,
        moment,
      );

      expect(created.statusCode).toBe(201);
      object = created.body as SurfaceObject;

      expect(object.kind).toBe('Fire');
      expect(object.state).toBe('Emerging');
      expect(object.version).toBe(1);
      expect(object.createdByUserId).toBe(borisSession.userId);
      expect(object.subjectUserId).toBe(annaSession.userId);
    },
    step,
  );

  it(
    'шаг 8: активация идёт по версии, устаревшая версия отклоняется',
    async () => {
      const url = `/v1/surface-objects/${object.id}/state`;
      const activated = await post(url, borisSession.accessToken, {
        transition: 'activate',
        version: object.version,
      });

      expect(activated.statusCode).toBe(201);
      const active = activated.body as SurfaceObject;
      expect(active.state).toBe('Active');
      expect(active.version).toBe(object.version + 1);

      // Повтор с той же (уже устаревшей) версией не меняет состояние на сервере.
      const repeated = await post(url, borisSession.accessToken, {
        transition: 'activate',
        version: object.version,
      });

      expect(repeated.statusCode).toBe(409);

      const snapshot = await get(`/v1/spaces/${space.id}/surface`, borisSession.accessToken);
      const stored = (snapshot.body as SurfaceSnapshot).objects.find(
        (item) => item.id === object.id,
      );

      expect(stored?.state).toBe('Active');
      expect(stored?.version).toBe(active.version);

      object = active;
    },
    step,
  );

  it(
    'шаг 9: партнёр видит момент, историю и статистику',
    async () => {
      const snapshot = await get(`/v1/spaces/${space.id}/surface`, annaSession.accessToken);
      const scene = snapshot.body as SurfaceSnapshot;

      expect(snapshot.statusCode).toBe(200);
      expect(scene.objects).toHaveLength(1);
      expect(scene.objects[0]?.id).toBe(object.id);
      expect(scene.objects[0]?.state).toBe('Active');
      expect(scene.objects[0]?.version).toBe(object.version);

      const types = await timelineTypes(annaSession.accessToken, [
        'MemberJoined',
        'SurfaceObjectCreated',
        'SurfaceObjectStateChanged',
      ]);

      expect(types).toContain('MemberJoined');
      expect(types).toContain('SurfaceObjectCreated');
      expect(types).toContain('SurfaceObjectStateChanged');

      const stats = await get(
        `/v1/spaces/${space.id}/timeline/statistics`,
        annaSession.accessToken,
      );
      const statistics = stats.body as Statistics;

      expect(statistics.totalObjects).toBe(1);
      expect(statistics.byKind['Fire']).toBe(1);
    },
    step,
  );

  it(
    'шаг 10: возвращение на другом устройстве видит то же состояние',
    async () => {
      const signedIn = await post('/v1/auth/sign-in', null, {
        email: boris.email,
        password: boris.password,
        device: { platform: 'web', model: null, appVersion: '1.0.0' },
      });

      expect(signedIn.statusCode).toBe(200);
      const returned = signedIn.body as AuthSession;
      expect(returned.userId).toBe(borisSession.userId);

      const snapshot = await get(`/v1/spaces/${space.id}/surface`, returned.accessToken);
      const scene = snapshot.body as SurfaceSnapshot;

      expect(scene.objects).toHaveLength(1);
      expect(scene.objects[0]?.id).toBe(object.id);
      expect(scene.objects[0]?.state).toBe('Active');

      const refreshed = await post('/v1/auth/refresh', null, {
        refreshToken: returned.refreshToken,
      });

      expect(refreshed.statusCode).toBe(200);
      expect((refreshed.body as AuthSession).accessToken.length).toBeGreaterThan(0);
    },
    step,
  );

  it(
    'зафиксированный пробел: создание момента пока не идемпотентно',
    async () => {
      const url = `/v1/spaces/${space.id}/surface-objects`;
      const payload = { kind: 'Fire', metadata: { note: 'Повтор из offline-очереди' } };

      const first = await post(url, borisSession.accessToken, payload);
      const second = await post(url, borisSession.accessToken, payload);

      expect(first.statusCode).toBe(201);
      expect(second.statusCode).toBe(201);

      // У создания нет ключа идемпотентности, поэтому потерянный ответ на успешный
      // POST превращается в дубликат момента. Когда появится clientRequestId,
      // этот тест должен упасть: замените проверку на равенство id.
      expect((second.body as SurfaceObject).id).not.toBe((first.body as SurfaceObject).id);

      const snapshot = await get(`/v1/spaces/${space.id}/surface`, annaSession.accessToken);

      expect((snapshot.body as SurfaceSnapshot).objects).toHaveLength(3);
    },
    step,
  );
});
