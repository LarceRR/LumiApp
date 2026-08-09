import { Global, Module } from '@nestjs/common';

import { IdempotencyService } from './idempotency/idempotency.service';
import { CLOCK, systemClock } from './utils/clock';
import { ID_GENERATOR, uuidGenerator } from './utils/id';
import { cryptoRandomSource, RANDOM_SOURCE } from './utils/random';

/** Process-wide infrastructure seams available to every feature module. */
@Global()
@Module({
  providers: [
    { provide: CLOCK, useValue: systemClock },
    { provide: ID_GENERATOR, useValue: uuidGenerator },
    { provide: RANDOM_SOURCE, useValue: cryptoRandomSource },
    IdempotencyService,
  ],
  exports: [CLOCK, ID_GENERATOR, RANDOM_SOURCE, IdempotencyService],
})
export class RuntimeModule {}
