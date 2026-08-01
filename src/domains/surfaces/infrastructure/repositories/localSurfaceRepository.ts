import type { LocalBackend } from '@/infrastructure/local/localBackend';

import type { SurfaceRepository } from '../../domain/repositories/SurfaceRepository';

export function createLocalSurfaceRepository(backend: LocalBackend): SurfaceRepository {
  return {
    snapshotBySpace: (spaceId) => backend.surfaceSnapshot(spaceId),
  };
}
