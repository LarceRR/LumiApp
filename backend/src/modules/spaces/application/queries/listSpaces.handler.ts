import { Inject, Injectable } from '@nestjs/common';

import { cacheKeys, cacheTtl } from '@/infrastructure/redis/cacheKeys';
import { CACHE, type Cache } from '@/infrastructure/redis/redisCache';
import type { UserId } from '@/modules/users/domain/value-objects/UserId';

import type { Invitation } from '../../domain/entities/Invitation';
import type { Space } from '../../domain/entities/Space';
import { SPACE_REPOSITORY, type SpaceRepository } from '../../domain/repositories/SpaceRepository';

@Injectable()
export class ListSpacesHandler {
  constructor(
    @Inject(SPACE_REPOSITORY) private readonly spaces: SpaceRepository,
    @Inject(CACHE) private readonly cache: Cache,
  ) {}

  async execute(userId: UserId): Promise<readonly Space[]> {
    return this.cache.remember(cacheKeys.spaceList(userId), cacheTtl.spaceList, () =>
      this.spaces.listForUser(userId).then((spaces) => [...spaces]),
    );
  }

  async listInvitations(userId: UserId, email: string): Promise<readonly Invitation[]> {
    return this.spaces.listInvitationsForUser(userId, email);
  }
}
