import type { SurfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';

export type VisibleFire = {
  readonly id: SurfaceObjectId;
  readonly cell: { readonly x: number; readonly y: number };
  readonly distanceSq: number;
};

export type FireCandidateInput = {
  readonly id: SurfaceObjectId;
  readonly cell: { readonly x: number; readonly y: number };
  readonly kind: string;
  readonly inFrustum: boolean;
};

export type SelectVisibleFiresOptions = {
  readonly fires: readonly FireCandidateInput[];
  readonly fireKind: string;
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
   * View-space depth along the camera look vector. Return null to skip
   * (e.g. fully dissolved in fog).
   */
  readonly viewDepth: (world: { readonly x: number; readonly z: number }) => number | null;
};

function signatureOf(items: readonly VisibleFire[]): string {
  return items.map((item) => `${item.id}:${item.cell.x},${item.cell.y}`).join('|');
}

export function visibleFiresSignature(items: readonly VisibleFire[]): string {
  return signatureOf(items);
}

/**
 * Pure selection of which fires to mount this frame.
 * Frustum + fog + quality cap, with the spawning fire always preferred.
 */
export function selectVisibleFires(options: SelectVisibleFiresOptions): readonly VisibleFire[] {
  const candidates: VisibleFire[] = [];
  const seen = new Set<string>();

  const push = (id: SurfaceObjectId, cell: { readonly x: number; readonly y: number }) => {
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
    const spawning = options.fires.find((fire) => fire.id === spawningId);

    if (spawning !== undefined && spawning.kind === options.fireKind) {
      push(spawning.id, spawning.cell);
    }
  }

  for (const fire of options.fires) {
    if (fire.kind !== options.fireKind || !fire.inFrustum) {
      continue;
    }

    push(fire.id, fire.cell);
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
