import { toSurfaceObject } from '@/domains/surface-objects/infrastructure/mappers/surfaceObjectMapper';
import type { HttpClient } from '@/infrastructure/http/httpClient';
import type { SurfaceSnapshotDto } from '@/shared/contracts';

import type { SurfaceRepository } from '../../domain/repositories/SurfaceRepository';
import { toSurface } from '../mappers/surfaceMapper';

export function createHttpSurfaceRepository(http: HttpClient): SurfaceRepository {
  return {
    async snapshotBySpace(spaceId) {
      const dto = await http.get<SurfaceSnapshotDto>(`spaces/${spaceId}/surface`);

      return {
        surface: toSurface(dto.surface),
        objects: dto.objects.map(toSurfaceObject),
      };
    },
  };
}
