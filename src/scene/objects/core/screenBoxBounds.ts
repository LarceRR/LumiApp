import {
  type OrbitFrame,
  orbitScreenBasis,
  pixelsPerWorldUnit,
  projectPoint,
  type ScreenBasis,
  type Viewport,
  type WorldVector,
} from '@/scene/camera/cameraConfig';

import type { ModelExtents } from './modelExtents';

export type ScreenRect = {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerY: number;
};

export type ScreenBox = {
  readonly rect: ScreenRect;
  /** Depth of the model's footing — where the pixel scale is taken. */
  readonly depth: number;
  readonly pixelsPerWorldUnit: number;
  readonly basis: ScreenBasis;
};

const SIGNS = [-1, 1] as const;

export function screenRect(minX: number, minY: number, maxX: number, maxY: number): ScreenRect {
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/**
 * Screen-space box of an upright model standing on `world`.
 *
 * Eight corners, projected — cheap, honest and kind-agnostic. It stays correct
 * top-down, where a model has no on-screen height and its footprint is the whole
 * silhouette, which is exactly where a constant pixel rectangle used to lie.
 */
export function screenBoxBounds(
  world: WorldVector,
  extents: ModelExtents,
  viewport: Viewport,
  basis: ScreenBasis,
): ScreenBox | null {
  if (viewport.width <= 0 || viewport.height <= 0) {
    return null;
  }

  const footing = projectPoint(basis, viewport, world);

  if (!footing.onScreen) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let seen = 0;

  for (const signX of SIGNS) {
    for (const signZ of SIGNS) {
      for (const lift of [0, extents.height]) {
        const corner = projectPoint(basis, viewport, {
          x: world.x + signX * extents.halfWidth,
          y: world.y + lift,
          z: world.z + signZ * extents.halfWidth,
        });

        if (!corner.onScreen) {
          continue;
        }

        minX = Math.min(minX, corner.x);
        minY = Math.min(minY, corner.y);
        maxX = Math.max(maxX, corner.x);
        maxY = Math.max(maxY, corner.y);
        seen += 1;
      }
    }
  }

  if (seen === 0) {
    return null;
  }

  return {
    rect: screenRect(minX, minY, maxX, maxY),
    depth: footing.depth,
    pixelsPerWorldUnit: pixelsPerWorldUnit(viewport.height, footing.depth, basis.tanHalf),
    basis,
  };
}

/** Same thing for callers holding an orbit rather than a basis. */
export function screenBoxBoundsForOrbit(
  world: WorldVector,
  extents: ModelExtents,
  viewport: Viewport,
  orbit: OrbitFrame,
): ScreenBox | null {
  return screenBoxBounds(world, extents, viewport, orbitScreenBasis(orbit, viewport));
}
