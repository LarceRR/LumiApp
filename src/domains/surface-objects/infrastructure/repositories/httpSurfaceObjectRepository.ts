import type { HttpClient } from '@/infrastructure/http/httpClient';
import type { SurfaceSnapshotDto, SurfaceObjectDto } from '@/shared/contracts';

import type {
  ChangeStateInput,
  CreateSurfaceObjectInput,
  SurfaceObjectRepository,
  UpdateSurfaceObjectInput,
} from '../../domain/repositories/SurfaceObjectRepository';
import type { SurfaceObjectId } from '../../domain/value-objects/SurfaceObjectId';
import { toSurfaceObject } from '../mappers/surfaceObjectMapper';

export function createHttpSurfaceObjectRepository(http: HttpClient): SurfaceObjectRepository {
  return {
    async listBySpace(spaceId) {
      const snapshot = await http.get<SurfaceSnapshotDto>(`spaces/${spaceId}/surface`);
      return snapshot.objects.map(toSurfaceObject);
    },

    async create(input: CreateSurfaceObjectInput) {
      const dto = await http.post<SurfaceObjectDto>(`spaces/${input.spaceId}/surface-objects`, {
        kind: input.kind,
        subjectUserId: input.subjectUserId,
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      });

      return toSurfaceObject(dto);
    },

    async changeState(input: ChangeStateInput) {
      const dto = await http.post<SurfaceObjectDto>(`surface-objects/${input.id}/state`, {
        transition: input.transition,
        version: input.version,
      });

      return toSurfaceObject(dto);
    },

    async update(input: UpdateSurfaceObjectInput) {
      const dto = await http.patch<SurfaceObjectDto>(`surface-objects/${input.id}`, {
        version: input.version,
        ...(input.favorite === undefined ? {} : { favorite: input.favorite }),
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      });

      return toSurfaceObject(dto);
    },

    async delete(id: SurfaceObjectId, version: number) {
      await http.delete(`surface-objects/${id}`, { version });
    },
  };
}
