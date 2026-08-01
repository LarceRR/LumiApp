import type { SpaceId } from '@/domains/spaces/domain/value-objects/SpaceId';

import type { TimelinePage } from '../entities/TimelineEvent';

export type TimelineQuery = {
  readonly spaceId: SpaceId;
  readonly cursor: string | null;
  readonly limit: number;
};

export type TimelineRepository = {
  page(query: TimelineQuery): Promise<TimelinePage>;
};
