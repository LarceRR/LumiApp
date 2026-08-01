import { cacheConfig } from '@/app/config/constants';
import type { SpaceId } from '@/domains/spaces/domain/value-objects/SpaceId';
import type { Query } from '@/shared/application/UseCase';

import type { TimelinePage } from '../domain/entities/TimelineEvent';
import type { TimelineRepository } from '../domain/repositories/TimelineRepository';

export type GetTimelineQuery = {
  readonly spaceId: SpaceId;
  readonly cursor: string | null;
};

export function getTimelineUseCase(deps: {
  readonly timeline: TimelineRepository;
}): Query<GetTimelineQuery, TimelinePage> {
  return async (query) =>
    deps.timeline.page({
      spaceId: query.spaceId,
      cursor: query.cursor,
      limit: cacheConfig.timelinePageSize,
    });
}
