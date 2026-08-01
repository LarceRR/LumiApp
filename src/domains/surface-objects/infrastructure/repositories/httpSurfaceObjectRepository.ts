import type { HttpClient } from '@/infrastructure/http/httpClient';
import type { SurfaceObjectDto } from '@/shared/contracts';

import type {
  ChangeStateInput,
  CreateSurfaceObjectInput,
  SurfaceObjectRepository,
  UpdateSurfaceObjectInput,
} from '../../domain/repositories/SurfaceObjectRepository';
import type { SurfaceObjectId } from '../../domain/value-objects/SurfaceObjectId';
import type { SurfaceObjectTransition } from '../../domain/value-objects/SurfaceObjectState';
import { toSurfaceObject } from '../mappers/surfaceObjectMapper';

const TRANSITION_PATHS: Readonly<Record<SurfaceObjectTransition, string>> = {
  activate: 'activate',
  soften: 'soften',
  age: 'age',
};

export function createHttpSurfaceObjectRepository(http: HttpClient): SurfaceObjectRepository {
  return {
    async listBySpace(spaceId) {
      const dtos = await http.get<readonly SurfaceObjectDto[]>('surface-objects', { spaceId });

      return dtos.map(toSurfaceObject);
    },

    async create(input: CreateSurfaceObjectInput) {
      const dto = await http.post<SurfaceObjectDto>('surface-objects', {
        spaceId: input.spaceId,
        kind: input.kind,
        subjectUserId: input.subjectUserId,
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      });

      return toSurfaceObject(dto);
    },

    async changeState(input: ChangeStateInput) {
      const dto = await http.post<SurfaceObjectDto>(
        `surface-objects/${input.id}/${TRANSITION_PATHS[input.transition]}`,
        { version: input.version },
      );

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
