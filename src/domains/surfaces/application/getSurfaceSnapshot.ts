import type { SpaceId } from '@/domains/spaces/domain/value-objects/SpaceId';
import type { Query } from '@/shared/application/UseCase';

import type { SurfaceRepository, SurfaceSnapshot } from '../domain/repositories/SurfaceRepository';

export function getSurfaceSnapshotUseCase(deps: {
  readonly surfaces: SurfaceRepository;
}): Query<SpaceId, SurfaceSnapshot> {
  return async (spaceId) => deps.surfaces.snapshotBySpace(spaceId);
}
