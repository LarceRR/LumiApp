import 'reflect-metadata';

// До остальных импортов: модули могут читать process.env уже при загрузке.
import '@/config/load-env';

import { createApp } from '@/bootstrap/createApp';
import { loadConfig } from '@/config/env';
import { initSentry } from '@/infrastructure/sentry/sentry';

async function bootstrap(): Promise<void> {
  // Config and Sentry come first: a misconfigured process should fail before it
  // opens a port, and instrumentation should cover startup itself.
  const config = loadConfig();
  initSentry(config);

  const { app } = await createApp();

  await app.listen({ port: config.app.port, host: config.app.host });
}

bootstrap().catch((error: unknown) => {
  console.error('Не удалось запустить сервер', error);
  process.exit(1);
});
