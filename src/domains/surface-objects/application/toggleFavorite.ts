import type { UseCase } from '@/shared/application/UseCase';

import type { SurfaceObject } from '../domain/entities/SurfaceObject';
import type { SurfaceObjectRepository } from '../domain/repositories/SurfaceObjectRepository';
import type { SurfaceObjectId } from '../domain/value-objects/SurfaceObjectId';

export type ToggleFavoriteCommand = {
  readonly id: SurfaceObjectId;
  readonly favorite: boolean;
  readonly version: number;
};

export function toggleFavoriteUseCase(deps: {
  readonly surfaceObjects: SurfaceObjectRepository;
}): UseCase<ToggleFavoriteCommand, SurfaceObject> {
  return async (command) =>
    deps.surfaceObjects.update({
      id: command.id,
      version: command.version,
      favorite: command.favorite,
    });
}

export type DeleteSurfaceObjectCommand = {
  readonly id: SurfaceObjectId;
  readonly version: number;
};

export function deleteSurfaceObjectUseCase(deps: {
  readonly surfaceObjects: SurfaceObjectRepository;
}): UseCase<DeleteSurfaceObjectCommand, void> {
  return async (command) => deps.surfaceObjects.delete(command.id, command.version);
}
