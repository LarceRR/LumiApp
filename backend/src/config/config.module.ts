import { Global, Module } from '@nestjs/common';

import { APP_CONFIG, type AppConfig, loadConfig } from './env';

/**
 * Config is resolved once and shared. Modules inject `APP_CONFIG` rather than
 * reading `process.env`, which keeps them testable.
 */
@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: (): AppConfig => loadConfig() }],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
