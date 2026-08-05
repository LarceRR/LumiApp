import type { HttpClient } from '@/infrastructure/http/httpClient';
import type { TimelinePageDto } from '@/shared/contracts';

import type { TimelineRepository } from '../../domain/repositories/TimelineRepository';
import { toTimelineEvent } from '../mappers/timelineMapper';

export function createHttpTimelineRepository(http: HttpClient): TimelineRepository {
  return {
    async page(query) {
      // История принадлежит пространству: GET /v1/spaces/:spaceId/timeline.
      // spaceId — сегмент пути, а не query-параметр, иначе маршрут не находится.
      const dto = await http.get<TimelinePageDto>(`spaces/${query.spaceId}/timeline`, {
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
