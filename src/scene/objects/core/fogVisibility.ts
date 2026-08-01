import { cameraMotion } from '@/design-system/motion/camera';
import { orbitPosition } from '@/scene/camera/cameraConfig';
import { fogDistanceBounds } from '@/scene/surface/surfaceGridMaterial';
import { clamp } from '@/shared/utils/math';

export type WorldPosition = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
};

/** Just enough of the orbit state to place the camera — keeps this file store-free. */
export type OrbitFrame = {
  readonly azimuth: number;
  readonly elevation: number;
  readonly distance: number;
  readonly target: WorldPosition;
};

/** Beyond this the object is indistinguishable from the haze. */
export const FOG_LOST_THRESHOLD = 0.995;

/** View-space depth along the camera look vector — the same value the fog uses. */
export function viewDepth(world: WorldPosition, orbit: OrbitFrame): number {
  const camera = orbitPosition(orbit);
  const fx = orbit.target.x - camera.x;
  const fy = orbit.target.y - camera.y;
  const fz = orbit.target.z - camera.z;
  const length = Math.hypot(fx, fy, fz) || 1;

  const dx = world.x - camera.x;
  const dy = world.y - camera.y;
  const dz = world.z - camera.z;

  return (dx * fx + dy * fy + dz * fz) / length;
}

/** 0 = fully clear, 1 = fully dissolved into the fog. Matches THREE.Fog (linear). */
export function fogFactor(depth: number, near: number, far: number): number {
  if (far <= near) {
    return depth >= far ? 1 : 0;
  }

  return clamp((depth - near) / (far - near), 0, 1);
}

export function orbitFogBounds(distance: number): {
  readonly near: number;
  readonly far: number;
} {
  return fogDistanceBounds(distance, cameraMotion.fogNearFactor, cameraMotion.fogFarFactor);
}

/** How far into the fog an object at `world` currently sits. */
export function objectFogFactor(world: WorldPosition, orbit: OrbitFrame): number {
  const bounds = orbitFogBounds(orbit.distance);

  return fogFactor(viewDepth(world, orbit), bounds.near, bounds.far);
}

export function isLostInFog(factor: number): boolean {
  return factor >= FOG_LOST_THRESHOLD;
}
