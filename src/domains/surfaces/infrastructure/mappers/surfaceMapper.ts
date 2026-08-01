import { spaceId } from '@/domains/spaces/domain/value-objects/SpaceId';
import type { SurfaceDto } from '@/shared/contracts';

import type { Surface } from '../../domain/entities/Surface';
import { surfaceId } from '../../domain/value-objects/SurfaceId';

export function toSurface(dto: SurfaceDto): Surface {
  return {
    id: surfaceId(dto.id),
    spaceId: spaceId(dto.spaceId),
    bounds: dto.bounds,
    version: dto.version,
  };
}

export function toSurfaceDto(entity: Surface): SurfaceDto {
  return {
    id: entity.id,
    spaceId: entity.spaceId,
    bounds: entity.bounds,
    version: entity.version,
  };
}
