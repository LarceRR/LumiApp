import { type CurrentUser, requireUserId } from '@/domains/auth/application/CurrentUser';
import type { UserId } from '@/domains/auth/domain/value-objects/UserId';
import type { SpaceRepository } from '@/domains/spaces/domain/repositories/SpaceRepository';
import { assertPermission } from '@/domains/spaces/domain/services/permissionService';
import type { SpaceId } from '@/domains/spaces/domain/value-objects/SpaceId';
import type { UseCase } from '@/shared/application/UseCase';
import { NetworkError } from '@/shared/errors';

import type { SurfaceObject, SurfaceObjectMetadata } from '../domain/entities/SurfaceObject';
import type { SurfaceObjectRepository } from '../domain/repositories/SurfaceObjectRepository';
import { assertSubjectAllowed, defaultSubjectUserId } from '../domain/services/surfaceObjectPolicy';
import type { SurfaceObjectKind } from '../domain/value-objects/SurfaceObjectKind';

export type CreateSurfaceObjectCommand = {
  readonly spaceId: SpaceId;
  readonly kind: SurfaceObjectKind;
  /** Omitted means "the other partner" (shared) or "myself" (personal). */
  readonly subjectUserId?: UserId;
  readonly metadata?: SurfaceObjectMetadata;
};

export type CreateSurfaceObjectDeps = {
  readonly spaces: SpaceRepository;
  readonly surfaceObjects: SurfaceObjectRepository;
  readonly currentUser: CurrentUser;
};

/**
 * The cell is deliberately absent from the command: placement is the domain's
 * decision, executed by the spawn policy on the write side.
 */
export function createSurfaceObjectUseCase(
  deps: CreateSurfaceObjectDeps,
): UseCase<CreateSurfaceObjectCommand, SurfaceObject> {
  return async (command) => {
    const createdByUserId = requireUserId(deps.currentUser);
    const space = await deps.spaces.byId(command.spaceId);

    if (space === null) {
      throw new NetworkError('Пространство не найдено', 404, {
        context: { spaceId: command.spaceId },
      });
    }

    assertPermission(space, createdByUserId, 'surfaceObject.create');

    const subjectUserId = command.subjectUserId ?? defaultSubjectUserId(space, createdByUserId);

    assertSubjectAllowed({
      space,
      kind: command.kind,
      createdByUserId,
      subjectUserId,
    });

    return deps.surfaceObjects.create({
      spaceId: command.spaceId,
      kind: command.kind,
      subjectUserId,
      ...(command.metadata === undefined ? {} : { metadata: command.metadata }),
    });
  };
}
