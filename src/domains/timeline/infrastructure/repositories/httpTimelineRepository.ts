import type { HttpClient } from '@/infrastructure/http/httpClient';
import type { TimelinePageDto } from '@/shared/contracts';

import type { TimelineRepository } from '../../domain/repositories/TimelineRepository';
import { toTimelineEvent } from '../mappers/timelineMapper';

export function createHttpTimelineRepository(http: HttpClient): TimelineRepository {
  return {
    async page(query) {
      const dto = await http.get<TimelinePageDto>('timeline', {
        spaceId: query.spaceId,
        limit: query.limit,
        ...(query.cursor === null ? {} : { cursor: query.cursor }),
      });

      return {
        events: dto.events.map(toTimelineEvent),
        nextCursor: dto.nextCursor,
      };
    },
  };
}
