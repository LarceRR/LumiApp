import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';
import type { SurfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';
import { cameraConfig, orbitPosition } from '@/scene/camera/cameraConfig';
import type { OrbitState } from '@/scene/stores/cameraStore';
import { cellToWorld } from '@/scene/surface/cellToWorld';
import { SURFACE_CELL_WORLD_SIZE } from '@/scene/surface/constants';

export type PickableFire = {
  readonly id: SurfaceObjectId;
  readonly cell: Cell;
};

/**
 * Ray–plane hit on y = 0 from a screen point, using the current orbit camera.
 */
export function groundHitFromScreen(
  screenX: number,
  screenY: number,
  screenWidth: number,
  screenHeight: number,
  orbit: OrbitState,
): { readonly x: number; readonly z: number } | null {
  if (screenWidth <= 0 || screenHeight <= 0) {
    return null;
  }

  const ndcX = (screenX / screenWidth) * 2 - 1;
  const ndcY = -((screenY / screenHeight) * 2 - 1);
  const cam = orbitPosition(orbit);
  const tx = orbit.target.x - cam.x;
  const ty = orbit.target.y - cam.y;
  const tz = orbit.target.z - cam.z;
  const fl = Math.hypot(tx, ty, tz) || 1;
  const fx = tx / fl;
  const fy = ty / fl;
  const fz = tz / fl;

  // Right = forward × worldUp (assuming worldUp = (0,1,0))
  let rx = -fz;
  let ry = 0;
  let rz = fx;
  const rl = Math.hypot(rx, ry, rz);
  if (rl < 1e-6) {
    rx = 1;
    ry = 0;
    rz = 0;
  } else {
    rx /= rl;
    rz /= rl;
  }

  // Up = Right × forward
  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;

  const aspect = screenWidth / screenHeight;
  const tanHalf = Math.tan((cameraConfig.fov * Math.PI) / 180 / 2);
  const dx = fx + rx * ndcX * tanHalf * aspect + ux * ndcY * tanHalf;
  const dy = fy + ry * ndcX * tanHalf * aspect + uy * ndcY * tanHalf;
  const dz = fz + rz * ndcX * tanHalf * aspect + uz * ndcY * tanHalf;
  const dl = Math.hypot(dx, dy, dz) || 1;
  const dirX = dx / dl;
  const dirY = dy / dl;
  const dirZ = dz / dl;

  if (Math.abs(dirY) < 1e-6) {
    return null;
  }

  const t = -cam.y / dirY;
  if (t < 0) {
    return null;
  }

  return { x: cam.x + dirX * t, z: cam.z + dirZ * t };
}

/** Nearest fire whose cell centre is within half a cell of the ground hit. */
export function pickNearestFire(
  hit: { readonly x: number; readonly z: number },
  fires: readonly PickableFire[],
  maxDistance = SURFACE_CELL_WORLD_SIZE * 0.65,
): PickableFire | null {
  let best: PickableFire | null = null;
  let bestDist = maxDistance;

  for (const fire of fires) {
    const world = cellToWorld(fire.cell);
    const dist = Math.hypot(world.x - hit.x, world.z - hit.z);
    if (dist <= bestDist) {
      best = fire;
      bestDist = dist;
    }
  }

  return best;
}
