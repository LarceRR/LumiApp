import type { SpaceId } from '@/domains/spaces/domain/value-objects/SpaceId';

import type { SurfaceBounds } from '../value-objects/SurfaceBounds';
import type { SurfaceId } from '../value-objects/SurfaceId';

/**
 * The grid of a space. Cells are never stored empty — occupancy is derived from
 * the surface object list, which keeps the payload proportional to real content.
 */
export type Surface = {
  readonly id: SurfaceId;
  readonly spaceId: SpaceId;
  readonly bounds: SurfaceBounds | null;
  readonly version: number;
};
