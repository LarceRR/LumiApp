import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { APP_CONFIG, type AppConfig } from '@/config/env';
import { SpaceAccessService } from '@/modules/spaces/application/services/spaceAccess.service';
import type { SpaceId } from '@/modules/spaces/domain/value-objects/SpacePermission';
import { SurfaceResolverService } from '@/modules/surfaces/application/services/surfaceResolver.service';
import {
  SURFACE_REPOSITORY,
  type SurfaceRepository,
} from '@/modules/surfaces/domain/repositories/SurfaceRepository';
import { spawnNearExisting } from '@/modules/surfaces/domain/services/spawnNearExisting';
import type { UserId } from '@/modules/users/domain/value-objects/UserId';
import { ConflictError } from '@/shared/errors';
import { domainEventNames, type SurfaceObjectCreatedEvent } from '@/shared/events/domainEvents';
import { RANDOM_SOURCE, type RandomSource } from '@/shared/utils/random';

import type { SurfaceObject, SurfaceObjectMetadata } from '../../domain/entities/SurfaceObject';
import {
  SURFACE_OBJECT_REPOSITORY,
  type SurfaceObjectRepository,
} from '../../domain/repositories/SurfaceObjectRepository';
import { assertSubjectAllowed, defaultSubjectUserId } from '../../domain/services/subjectPolicy';
import { kindPolicy, type SurfaceObjectKind } from '../../domain/value-objects/SurfaceObjectKind';
import { toSurfaceObjectDto } from '../mappers/surfaceObject.mapper';

export type CreateSurfaceObjectCommand = {
  readonly spaceId: SpaceId;
  readonly createdByUserId: UserId;
  readonly kind: SurfaceObjectKind;
  readonly subjectUserId: UserId | null;
  readonly metadata: SurfaceObjectMetadata;
};

/** A lost race for a cell is retried, not surfaced to the user. */
const MAX_CELL_ATTEMPTS = 5;

@Injectable()
export class CreateSurfaceObjectHandler {
  constructor(
    @Inject(SURFACE_OBJECT_REPOSITORY) private readonly objects: SurfaceObjectRepository,
    @Inject(SURFACE_REPOSITORY) private readonly surfaces: SurfaceRepository,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(RANDOM_SOURCE) private readonly random: RandomSource,
    private readonly access: SpaceAccessService,
    private readonly surfaceResolver: SurfaceResolverService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(command: CreateSurfaceObjectCommand): Promise<SurfaceObject> {
    const space = await this.access.assertPermission(
      command.spaceId,
      command.createdByUserId,
      'surfaceObject.create',
    );

    const subjectUserId =
      command.subjectUserId ?? defaultSubjectUserId(space, command.createdByUserId);

    assertSubjectAllowed({
      space,
      kind: command.kind,
      createdByUserId: command.createdByUserId,
      subjectUserId,
    });

    const surface = await this.surfaceResolver.resolve(space.id);
    const radius = Math.max(kindPolicy(command.kind).spawnRadius, this.config.surface.spawnRadius);

    const created = await this.insertAtFreeCell({
      surfaceId: surface.id,
      spaceId: space.id,
      radius,
      command,
      subjectUserId,
    });

    // The surface version changes with occupancy so clients can diff cheaply.
    await this.surfaces.touch(surface.id);
    await this.access.invalidate(space.id);

    this.events.emit(domainEventNames.surfaceObjectCreated, {
      spaceId: space.id,
      actorUserId: command.createdByUserId,
      object: toSurfaceObjectDto(created),
    } satisfies SurfaceObjectCreatedEvent);

    return created;
  }

  private async insertAtFreeCell(params: {
    readonly surfaceId: SurfaceObject['surfaceId'];
    readonly spaceId: SpaceId;
    readonly radius: number;
    readonly command: CreateSurfaceObjectCommand;
    readonly subjectUserId: UserId;
  }): Promise<SurfaceObject> {
    let lastConflict: ConflictError | null = null;

    for (let attempt = 0; attempt < MAX_CELL_ATTEMPTS; attempt += 1) {
      const existing = await this.objects.listBySurface(params.surfaceId);
      const occupied = existing.map((object) => object.cell);
      const lastCreated = existing.reduce<(typeof existing)[number] | undefined>(
        (latest, object) => {
          if (latest === undefined || object.createdAt >= latest.createdAt) {
            return object;
          }

          return latest;
        },
        undefined,
      );
      const policy = kindPolicy(params.command.kind);
      const cell = spawnNearExisting({
        occupied,
        radius: params.radius,
        random: this.random,
        minSeparation: policy.minSeparation,
        ...(lastCreated === undefined ? {} : { near: lastCreated.cell }),
      });

      try {
        return await this.objects.insert({
          spaceId: params.spaceId,
          surfaceId: params.surfaceId,
          cell,
          kind: params.command.kind,
          // Objects arrive as Emerging: the client plays the spawn sequence and
          // then activates, so the animation is part of the model, not a guess.
          state: 'Emerging',
          createdByUserId: params.command.createdByUserId,
          subjectUserId: params.subjectUserId,
          metadata: params.command.metadata,
        });
      } catch (error) {
        if (error instanceof ConflictError) {
          lastConflict = error;
          continue;
        }

        throw error;
      }
    }

    throw (
      lastConflict ??
      new ConflictError('Не удалось занять ячейку на поверхности', {
        surfaceId: params.surfaceId,
      })
    );
  }
}
