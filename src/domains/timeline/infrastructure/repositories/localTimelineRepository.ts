import type { LocalBackend } from '@/infrastructure/local/localBackend';

import type { TimelineRepository } from '../../domain/repositories/TimelineRepository';

export function createLocalTimelineRepository(backend: LocalBackend): TimelineRepository {
  return {
    page: (query) => backend.timelinePage(query),
  };
}
