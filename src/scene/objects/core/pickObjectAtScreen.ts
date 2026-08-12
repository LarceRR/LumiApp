import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';
import type { SurfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';
import { type OrbitFrame, orbitScreenBasis, screenGroundHit } from '@/scene/camera/cameraConfig';
import { cellToWorld } from '@/scene/surface/cellToWorld';
import { SURFACE_CELL_WORLD_SIZE } from '@/scene/surface/constants';

export type PickableObject = {
  readonly id: SurfaceObjectId;
  readonly cell: Cell;
};

/**
 * Ray-plane hit on y = 0 from a screen point, using the current orbit camera.
 *
 * The basis comes from `orbitScreenBasis`, which is why this now works looking
 * straight down: the old local cross product collapsed there and rotated every
 * hit by the azimuth, so taps landed on empty cells and drags ran backwards.
 */
export function groundHitFromScreen(
  screenX: number,
  screenY: number,
  screenWidth: number,
  screenHeight: number,
  orbit: OrbitFrame,
): { readonly x: number; readonly z: number } | null {
  const viewport = { width: screenWidth, height: screenHeight };

  if (viewport.width <= 0 || viewport.height <= 0) {
    return null;
  }

  return screenGroundHit(orbitScreenBasis(orbit, viewport), viewport, screenX, screenY);
}

/** Nearest object whose cell centre is within half a cell of the ground hit. */
export function pickNearestObject(
  hit: { readonly x: number; readonly z: number },
  objects: readonly PickableObject[],
  maxDistance = SURFACE_CELL_WORLD_SIZE * 0.65,
): PickableObject | null {
  let best: PickableObject | null = null;
  let bestDist = maxDistance;

  for (const object of objects) {
    const world = cellToWorld(object.cell);
    const dist = Math.hypot(world.x - hit.x, world.z - hit.z);

    if (dist <= bestDist) {
      best = object;
      bestDist = dist;
    }
  }

  return best;
}
