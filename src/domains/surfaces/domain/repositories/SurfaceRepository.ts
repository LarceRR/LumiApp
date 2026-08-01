import type { SpaceId } from '@/domains/spaces/domain/value-objects/SpaceId';
import type { SurfaceObject } from '@/domains/surface-objects/domain/entities/SurfaceObject';

import type { Surface } from '../entities/Surface';

export type SurfaceSnapshot = {
  readonly surface: Surface;
  readonly objects: readonly SurfaceObject[];
};

export type SurfaceRepository = {
  snapshotBySpace(spaceId: SpaceId): Promise<SurfaceSnapshot>;
};
