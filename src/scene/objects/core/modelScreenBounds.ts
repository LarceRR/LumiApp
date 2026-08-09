import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';
import { cameraConfig } from '@/scene/camera/cameraConfig';
import type { WorldPoint } from '@/scene/surface/cellToWorld';

import type { OrbitFrame } from './fogVisibility';
import {
  cameraBasis,
  pointsPerWorldUnit,
  projectWorldToScreen,
  type ScreenPoint,
  type Vec3,
  type Viewport,
} from './projectToScreen';

/** A model's footprint, authored around its base on the surface plane. */
export type ModelLocalBounds = {
  /** Half of the horizontal extent, world units, on both X and Z. */
  readonly halfWidth: number;
  /** Height above the surface plane, world units. */
  readonly height: number;
};

export type ModelWorldBounds = {
  /** Where the model touches the surface. */
  readonly base: Vec3;
  readonly center: Vec3;
  readonly min: Vec3;
  readonly max: Vec3;
  readonly size: Vec3;
};

export type ScreenRect = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerY: number;
};

/**
 * Everything measurable about one model in one frame: where it is in the world,
 * where it lands on the display and how big it reads there.
 *
 * This is a snapshot, not a live binding. It is correct for the camera state it
 * was captured with and becomes stale the moment the camera moves.
 */
export type ModelScreenBounds = {
  readonly id: string | null;
  readonly cell: Cell | null;
  readonly world: ModelWorldBounds;
  /** Axis-aligned screen box around all eight projected corners, in points. */
  readonly screen: ScreenRect;
  /** Where the world centre itself lands. Not the same as the box centre. */
  readonly projectedCenter: ScreenPoint;
  readonly projectedBase: ScreenPoint | null;
  readonly viewport: Viewport;
  readonly camera: {
    readonly position: Vec3;
    readonly target: Vec3;
    readonly azimuth: number;
    readonly elevation: number;
    readonly distance: number;
    readonly fov: number;
  };
  /** Camera-forward distance to the model centre, world units. */
  readonly depth: number;
  readonly pointsPerWorldUnit: number;
  /** Fraction of the viewport height the box occupies. */
  readonly screenHeightFraction: number;
  /** Fraction of the viewport width the box occupies. */
  readonly screenWidthFraction: number;
  /** The box overlaps the viewport at all. */
  readonly onScreen: boolean;
  /** Every corner is inside the viewport. */
  readonly fullyVisible: boolean;
  /** A corner sat behind the lens, so the box is an underestimate. */
  readonly clipped: boolean;
  readonly capturedAtMs: number;
};

export type ModelScreenBoundsInput = {
  /** Where the model stands, on the surface plane. */
  readonly origin: WorldPoint;
  readonly local: ModelLocalBounds;
  readonly orbit: OrbitFrame;
  readonly viewport: Viewport;
  readonly id?: string | null;
  readonly cell?: Cell | null;
};

/** Local half-extents lifted into a world-space AABB standing on `base`. */
export function modelWorldBounds(base: Vec3, local: ModelLocalBounds): ModelWorldBounds {
  const halfWidth = Math.max(local.halfWidth, 0);
  const height = Math.max(local.height, 0);
  const min: Vec3 = { x: base.x - halfWidth, y: base.y, z: base.z - halfWidth };
  const max: Vec3 = { x: base.x + halfWidth, y: base.y + height, z: base.z + halfWidth };

  return {
    base,
    center: { x: base.x, y: base.y + height / 2, z: base.z },
    min,
    max,
    size: { x: halfWidth * 2, y: height, z: halfWidth * 2 },
  };
}

function corners(bounds: ModelWorldBounds): readonly Vec3[] {
  const { min, max } = bounds;

  return [
    { x: min.x, y: min.y, z: min.z },
    { x: max.x, y: min.y, z: min.z },
    { x: min.x, y: min.y, z: max.z },
    { x: max.x, y: min.y, z: max.z },
    { x: min.x, y: max.y, z: min.z },
    { x: max.x, y: max.y, z: min.z },
    { x: min.x, y: max.y, z: max.z },
    { x: max.x, y: max.y, z: max.z },
  ];
}

/**
 * The 2D hitbox of a model: project all eight corners of its world AABB and
 * keep the axis-aligned screen box around them.
 *
 * Returns `null` only when the model centre is behind the lens, which is the
 * one case where there is no meaningful box to draw.
 */
export function getModelScreenBounds(input: ModelScreenBoundsInput): ModelScreenBounds | null {
  const { origin, local, orbit, viewport } = input;

  if (viewport.width <= 0 || viewport.height <= 0) {
    return null;
  }

  const base: Vec3 = { x: origin.x, y: origin.y ?? 0, z: origin.z };
  const world = modelWorldBounds(base, local);
  const basis = cameraBasis(orbit, viewport);
  const projectedCenter = projectWorldToScreen(world.center, basis, viewport);

  if (projectedCenter === null) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let clipped = false;
  let fullyVisible = true;

  for (const corner of corners(world)) {
    const projected = projectWorldToScreen(corner, basis, viewport);

    if (projected === null) {
      clipped = true;
      fullyVisible = false;
      continue;
    }

    minX = Math.min(minX, projected.x);
    maxX = Math.max(maxX, projected.x);
    minY = Math.min(minY, projected.y);
    maxY = Math.max(maxY, projected.y);

    if (
      projected.x < 0 ||
      projected.y < 0 ||
      projected.x > viewport.width ||
      projected.y > viewport.height
    ) {
      fullyVisible = false;
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return null;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const screen: ScreenRect = {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };

  return {
    id: input.id ?? null,
    cell: input.cell ?? null,
    world,
    screen,
    projectedCenter,
    projectedBase: projectWorldToScreen(world.base, basis, viewport),
    viewport,
    camera: {
      position: basis.position,
      target: { x: orbit.target.x, y: orbit.target.y, z: orbit.target.z },
      azimuth: orbit.azimuth,
      elevation: orbit.elevation,
      distance: orbit.distance,
      fov: cameraConfig.fov,
    },
    depth: projectedCenter.depth,
    pointsPerWorldUnit: pointsPerWorldUnit(projectedCenter.depth, basis, viewport),
    screenHeightFraction: height / viewport.height,
    screenWidthFraction: width / viewport.width,
    onScreen: maxX >= 0 && minX <= viewport.width && maxY >= 0 && minY <= viewport.height,
    fullyVisible,
    clipped,
    capturedAtMs: Date.now(),
  };
}
