import type { LocalBackend } from '@/infrastructure/local/localBackend';

import type { SurfaceObjectRepository } from '../../domain/repositories/SurfaceObjectRepository';

export function createLocalSurfaceObjectRepository(backend: LocalBackend): SurfaceObjectRepository {
  return {
    listBySpace: (spaceId) => backend.listObjects(spaceId),
    create: (input) => backend.createObject(input),
    changeState: (input) => backend.changeObjectState(input),
    update: (input) => backend.updateObject(input),
    delete: (id, version) => backend.deleteObject(id, version),
  };
}
