import type { UseCase } from '@/shared/application/UseCase';
import { DomainError } from '@/shared/errors';

import type { SurfaceObject } from '../domain/entities/SurfaceObject';
import type { SurfaceObjectRepository } from '../domain/repositories/SurfaceObjectRepository';
import type { SurfaceObjectId } from '../domain/value-objects/SurfaceObjectId';
import {
  canApplyTransition,
  type SurfaceObjectState,
  type SurfaceObjectTransition,
} from '../domain/value-objects/SurfaceObjectState';

export type ChangeSurfaceObjectStateCommand = {
  readonly id: SurfaceObjectId;
  readonly currentState: SurfaceObjectState;
  readonly version: number;
};

export type ChangeSurfaceObjectStateDeps = {
  readonly surfaceObjects: SurfaceObjectRepository;
};

function stateTransitionUseCase(
  transition: SurfaceObjectTransition,
  deps: ChangeSurfaceObjectStateDeps,
): UseCase<ChangeSurfaceObjectStateCommand, SurfaceObject> {
  return async (command) => {
    if (!canApplyTransition(command.currentState, transition)) {
      throw new DomainError('Недопустимый переход состояния объекта', {
        context: { id: command.id, state: command.currentState, transition },
      });
    }

    return deps.surfaceObjects.changeState({
      id: command.id,
      transition,
      version: command.version,
    });
  };
}

/** Emerging → Active */
export function activateSurfaceObjectUseCase(deps: ChangeSurfaceObjectStateDeps) {
  return stateTransitionUseCase('activate', deps);
}

/** Active → Fading */
export function softenSurfaceObjectUseCase(deps: ChangeSurfaceObjectStateDeps) {
  return stateTransitionUseCase('soften', deps);
}

/** Fading → Settled. Normally driven by the server scheduler. */
export function ageSurfaceObjectUseCase(deps: ChangeSurfaceObjectStateDeps) {
  return stateTransitionUseCase('age', deps);
}
