import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { WsAdapter } from '@nestjs/platform-ws';
import { Logger } from 'nestjs-pino';

import { AppModule } from '@/app/app.module';
import { APP_CONFIG, type AppConfig } from '@/config/env';

import { setupSwagger } from './swagger';

/**
 * Fastify adapter (Express is explicitly out), native `ws` for realtime, and a
 * global `/v1` prefix so a future breaking change can live side by side.
 */
export async function createApp(): Promise<{
  app: NestFastifyApplication;
  config: AppConfig;
}> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, bodyLimit: 1_048_576 }),
    { bufferLogs: true },
  );

  const config = app.get<AppConfig>(APP_CONFIG);

  app.useLogger(app.get(Logger));
  app.flushLogs();
  app.setGlobalPrefix('v1', { exclude: ['health'] });
  app.useWebSocketAdapter(new WsAdapter(app));
  app.enableShutdownHooks();

  await app.register(import('@fastify/helmet'), {
    // The API serves JSON only; CSP would just add noise.
    contentSecurityPolicy: false,
  });

  await app.register(import('@fastify/cors'), {
    origin: config.app.corsOrigins.length === 0 ? true : [...config.app.corsOrigins],
    credentials: true,
  });

  setupSwagger(app, config);

  return { app, config };
}
