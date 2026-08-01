import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';

import { HealthController } from '@/app/health/health.controller';
import { ConfigModule } from '@/config/config.module';
import { DrizzleModule } from '@/database/drizzle/drizzle.module';
import { QueueModule } from '@/infrastructure/queue/queue.module';
import { RecurringJobs } from '@/infrastructure/queue/schedulers/recurringJobs';
import { RedisModule } from '@/infrastructure/redis/redis.module';
import { StorageModule } from '@/infrastructure/storage/storage.module';
import { AiModule } from '@/modules/ai/ai.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { BillingModule } from '@/modules/billing/billing.module';
import { MediaModule } from '@/modules/media/media.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { SpacesModule } from '@/modules/spaces/spaces.module';
import { SurfaceObjectsModule } from '@/modules/surface-objects/surfaceObjects.module';
import { SurfacesModule } from '@/modules/surfaces/surfaces.module';
import { TimelineModule } from '@/modules/timeline/timeline.module';
import { UsersModule } from '@/modules/users/users.module';
import { AppExceptionFilter } from '@/shared/filters/appException.filter';
import { JwtAuthGuard } from '@/shared/guards/jwtAuth.guard';
import { SpacePermissionGuard } from '@/shared/guards/spacePermission.guard';
import { LoggerModule } from '@/shared/logger/logger.module';
import { CLOCK, systemClock } from '@/shared/utils/clock';
import { ID_GENERATOR, uuidGenerator } from '@/shared/utils/id';
import { cryptoRandomSource, RANDOM_SOURCE } from '@/shared/utils/random';

/**
 * The composition root. Guards, the validation pipe and the error filter are
 * registered globally so a new module is secure, validated and consistent without
 * repeating itself.
 *
 * Order matters: authentication runs before the space permission check, and
 * throttling runs first so an unauthenticated flood is cheap to reject.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DrizzleModule,
    RedisModule,
    QueueModule,
    StorageModule,
    EventEmitterModule.forRoot({ wildcard: false, verboseMemoryLeak: false }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),

    AuthModule,
    UsersModule,
    SpacesModule,
    SurfacesModule,
    SurfaceObjectsModule,
    TimelineModule,
    BillingModule,
    AiModule,
    NotificationsModule,
    MediaModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: CLOCK, useValue: systemClock },
    { provide: ID_GENERATOR, useValue: uuidGenerator },
    { provide: RANDOM_SOURCE, useValue: cryptoRandomSource },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: SpacePermissionGuard },
    RecurringJobs,
  ],
})
export class AppModule {}
