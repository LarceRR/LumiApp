import type { SurfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';

export type VisibleObject = {
  readonly id: SurfaceObjectId;
  readonly cell: { readonly x: number; readonly y: number };
  readonly distanceSq: number;
};

export type ObjectCandidate = {
  readonly id: SurfaceObjectId;
  readonly cell: { readonly x: number; readonly y: number };
  readonly kind: string;
  readonly inFrustum: boolean;
};

export type SelectVisibleObjectsOptions = {
  readonly objects: readonly ObjectCandidate[];
  readonly kind: string;
  readonly spawningId: SurfaceObjectId | null;
  readonly maxInstances: number;
  /** World XZ of the orbit target — used for nearest-first ranking. */
  readonly target: { readonly x: number; readonly z: number };
  /** Cell centre → world XZ. */
  readonly cellToWorld: (cell: { readonly x: number; readonly y: number }) => {
    readonly x: number;
    readonly z: number;
  };
  /**
   * View-space depth along the camera look vector. Return null to skip the
   * object entirely (e.g. fully dissolved in fog).
   */
  readonly viewDepth: (world: { readonly x: number; readonly z: number }) => number | null;
};

export function visibleObjectsSignature(items: readonly VisibleObject[]): string {
  return items.map((item) => `${item.id}:${item.cell.x},${item.cell.y}`).join('|');
}

/**
 * Pure selection of which objects to draw this frame.
 * Frustum + fog + quality cap, with the spawning object always preferred.
 */
export function selectVisibleObjects(
  options: SelectVisibleObjectsOptions,
): readonly VisibleObject[] {
  const candidates: VisibleObject[] = [];
  const seen = new Set<string>();

  const push = (id: SurfaceObjectId, cell: { readonly x: number; readonly y: number }): void => {
    if (seen.has(id)) {
      return;
    }

    seen.add(id);
    const world = options.cellToWorld(cell);
    const depth = options.viewDepth(world);

    if (depth === null) {
      return;
    }

    const dx = world.x - options.target.x;
    const dz = world.z - options.target.z;
    candidates.push({ id, cell, distanceSq: dx * dx + dz * dz });
  };

  const spawningId = options.spawningId;

  if (spawningId !== null) {
    const spawning = options.objects.find((object) => object.id === spawningId);

    if (spawning !== undefined && spawning.kind === options.kind) {
      push(spawning.id, spawning.cell);
    }
  }

  for (const object of options.objects) {
    if (object.kind !== options.kind || !object.inFrustum) {
      continue;
    }

    push(object.id, object.cell);
  }

  candidates.sort((left, right) => left.distanceSq - right.distanceSq);
  let next = candidates.slice(0, options.maxInstances);

  if (spawningId !== null && !next.some((item) => item.id === spawningId)) {
    const spawning = candidates.find((item) => item.id === spawningId);

    if (spawning !== undefined) {
      next =
        next.length >= options.maxInstances
          ? [...next.slice(0, -1), spawning]
          : [...next, spawning];
    }
  }

  return next;
}
