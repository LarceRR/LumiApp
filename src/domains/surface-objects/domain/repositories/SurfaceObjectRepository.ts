import type { UserId } from '@/domains/auth/domain/value-objects/UserId';
import type { SpaceId } from '@/domains/spaces/domain/value-objects/SpaceId';

import type { SurfaceObject, SurfaceObjectMetadata } from '../entities/SurfaceObject';
import type { SurfaceObjectId } from '../value-objects/SurfaceObjectId';
import type { SurfaceObjectKind } from '../value-objects/SurfaceObjectKind';
import type { SurfaceObjectTransition } from '../value-objects/SurfaceObjectState';

export type CreateSurfaceObjectInput = {
  readonly spaceId: SpaceId;
  readonly kind: SurfaceObjectKind;
  readonly subjectUserId: UserId;
  readonly metadata?: SurfaceObjectMetadata;
};

export type ChangeStateInput = {
  readonly id: SurfaceObjectId;
  readonly transition: SurfaceObjectTransition;
  readonly version: number;
};

export type UpdateSurfaceObjectInput = {
  readonly id: SurfaceObjectId;
  readonly version: number;
  readonly favorite?: boolean;
  readonly metadata?: SurfaceObjectMetadata;
};

/** Port. Implemented by the HTTP adapter and by the offline-first local adapter. */
export type SurfaceObjectRepository = {
  listBySpace(spaceId: SpaceId): Promise<readonly SurfaceObject[]>;
  create(input: CreateSurfaceObjectInput): Promise<SurfaceObject>;
  changeState(input: ChangeStateInput): Promise<SurfaceObject>;
  update(input: UpdateSurfaceObjectInput): Promise<SurfaceObject>;
  delete(id: SurfaceObjectId, version: number): Promise<void>;
};
