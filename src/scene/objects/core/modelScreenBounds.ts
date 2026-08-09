import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';
import type { SurfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { cameraConfig, orbitPosition } from '@/scene/camera/cameraConfig';
import type { FireSettings } from '@/scene/objects/fire/fireSettings';
import { useFireSettingsStore } from '@/scene/objects/fire/fireSettingsStore';
import type { OrbitState, OrbitTarget } from '@/scene/stores/cameraStore';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { cellToWorld, type WorldPoint } from '@/scene/surface/cellToWorld';

import { sampleModelParticles } from './modelSampler';

const DEG_TO_RAD = Math.PI / 180;
const EPSILON = 1e-6;

export type Viewport = { readonly width: number; readonly height: number };

export type ScreenPoint = { readonly x: number; readonly y: number };

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

export type ProjectedPoint = {
  readonly x: number;
  readonly y: number;
  /** Distance along the view axis. Zero or less means behind the camera. */
  readonly depth: number;
  readonly onScreen: boolean;
};

/** Analytic box used when no live particles are available. */
export type ModelExtents = { readonly halfWidth: number; readonly height: number };

export type ModelScreenBounds = {
  readonly id: SurfaceObjectId;
  readonly kind: string;
  readonly cell: Cell;
  /** Where the model stands on the surface, world units. */
  readonly world: WorldPoint;
  readonly screen: ScreenRect;
  readonly center: ScreenPoint;
  /** Where the model meets the surface, screen px. */
  readonly anchor: ScreenPoint;
  /** `anchor.y - center.y`: how far the visual centre floats above the base. */
  readonly centerLiftPx: number;
  readonly viewport: Viewport;
  readonly camera: {
    readonly azimuth: number;
    readonly elevation: number;
    readonly distance: number;
    readonly fov: number;
    readonly target: OrbitTarget;
  };
  /** Distance from the camera along the view axis, world units. */
  readonly depth: number;
  readonly pixelsPerWorldUnit: number;
  readonly approxWorldWidth: number;
  readonly approxWorldHeight: number;
  readonly particleCount: number;
  /** True when the box came from live particles rather than the analytic box. */
  readonly sampled: boolean;
  readonly onScreen: boolean;
  readonly capturedAt: number;
};

export type ModelBoundsInput = {
  readonly id: SurfaceObjectId;
  readonly kind: string;
  readonly cell: Cell;
  readonly viewport: Viewport;
  readonly orbit: OrbitState;
  readonly extents: ModelExtents;
};

type CameraBasis = {
  readonly camX: number;
  readonly camY: number;
  readonly camZ: number;
  readonly fx: number;
  readonly fy: number;
  readonly fz: number;
  readonly rx: number;
  readonly ry: number;
  readonly rz: number;
  readonly ux: number;
  readonly uy: number;
  readonly uz: number;
  readonly tanHalf: number;
  readonly aspect: number;
};

/**
 * Camera frame for the current orbit, resolved once and reused for every
 * particle. Mirrors `groundHitFromScreen` exactly, in the other direction.
 */
function cameraBasis(orbit: OrbitState, viewport: Viewport): CameraBasis {
  const cam = orbitPosition(orbit);
  const tx = orbit.target.x - cam.x;
  const ty = orbit.target.y - cam.y;
  const tz = orbit.target.z - cam.z;
  const length = Math.hypot(tx, ty, tz) || 1;
  const fx = tx / length;
  const fy = ty / length;
  const fz = tz / length;

  let rx = -fz;
  const ry = 0;
  let rz = fx;
  const rl = Math.hypot(rx, ry, rz);

  if (rl < EPSILON) {
    rx = 1;
    rz = 0;
  } else {
    rx /= rl;
    rz /= rl;
  }

  return {
    camX: cam.x,
    camY: cam.y,
    camZ: cam.z,
    fx,
    fy,
    fz,
    rx,
    ry,
    rz,
    ux: ry * fz - rz * fy,
    uy: rz * fx - rx * fz,
    uz: rx * fy - ry * fx,
    tanHalf: Math.tan((cameraConfig.fov * DEG_TO_RAD) / 2),
    aspect: viewport.width / Math.max(viewport.height, 1),
  };
}

function projectWith(
  basis: CameraBasis,
  viewport: Viewport,
  x: number,
  y: number,
  z: number,
): ProjectedPoint {
  const vx = x - basis.camX;
  const vy = y - basis.camY;
  const vz = z - basis.camZ;
  const depth = vx * basis.fx + vy * basis.fy + vz * basis.fz;

  if (depth <= EPSILON) {
    return { x: Number.NaN, y: Number.NaN, depth, onScreen: false };
  }

  const right = vx * basis.rx + vy * basis.ry + vz * basis.rz;
  const up = vx * basis.ux + vy * basis.uy + vz * basis.uz;
  const ndcX = right / (depth * basis.tanHalf * basis.aspect);
  const ndcY = up / (depth * basis.tanHalf);
  const screenX = ((ndcX + 1) / 2) * viewport.width;
  const screenY = ((1 - ndcY) / 2) * viewport.height;

  return {
    x: screenX,
    y: screenY,
    depth,
    onScreen:
      screenX >= 0 && screenX <= viewport.width && screenY >= 0 && screenY <= viewport.height,
  };
}

function pixelsPerWorldUnit(basis: CameraBasis, viewport: Viewport, depth: number): number {
  return viewport.height / (2 * Math.max(depth, EPSILON) * basis.tanHalf);
}

/** Project a single world point with the current orbit camera. */
export function projectWorldToScreen(
  point: WorldPoint,
  viewport: Viewport,
  orbit: OrbitState,
): ProjectedPoint {
  return projectWith(cameraBasis(orbit, viewport), viewport, point.x, point.y, point.z);
}

/**
 * Conservative box for a fire when its particles cannot be read.
 *
 * `speedMin * lifeTime` rather than `speedMax`: the tallest theoretical
 * particle is far above anything the eye reads as the flame.
 */
export function fireModelExtents(settings: FireSettings): ModelExtents {
  const spread = Math.max(settings.ember.spread, settings.flame.spread);
  const widest = Math.max(settings.ember.scaleTo.max, settings.flame.scaleTo.max);
  const tallest = Math.max(
    settings.ember.speedMin * settings.ember.lifeTime,
    settings.flame.speedMin * settings.flame.lifeTime,
  );

  return {
    halfWidth: (spread / 2 + widest) * settings.worldScale,
    height: (tallest + widest) * settings.worldScale,
  };
}

/**
 * Everything measurable about a model on screen, right now.
 *
 * The box comes from the live particle cloud when the renderer can hand it
 * over, so it is a genuine snapshot of what the user is looking at, not a
 * guess derived from settings. `sampled` says which of the two you got.
 */
export function modelScreenBounds(input: ModelBoundsInput): ModelScreenBounds | null {
  const { id, kind, cell, viewport, orbit, extents } = input;

  if (viewport.width <= 0 || viewport.height <= 0) {
    return null;
  }

  const world = cellToWorld(cell);
  const basis = cameraBasis(orbit, viewport);

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let count = 0;

  const expand = (x: number, y: number, z: number, size: number): void => {
    const projected = projectWith(basis, viewport, x, y, z);

    if (projected.depth <= EPSILON) {
      return;
    }

    const radius = (size / 2) * pixelsPerWorldUnit(basis, viewport, projected.depth);
    minX = Math.min(minX, projected.x - radius);
    maxX = Math.max(maxX, projected.x + radius);
    minY = Math.min(minY, projected.y - radius);
    maxY = Math.max(maxY, projected.y + radius);
    count += 1;
  };

  const sampled = sampleModelParticles(id, expand);

  if (count === 0) {
    for (const dx of [-extents.halfWidth, extents.halfWidth]) {
      for (const dz of [-extents.halfWidth, extents.halfWidth]) {
        for (const dy of [0, extents.height]) {
          expand(world.x + dx, world.y + dy, world.z + dz, 0);
        }
      }
    }
  }

  if (count === 0) {
    return null;
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const base = projectWith(basis, viewport, world.x, world.y, world.z);
  const anchor: ScreenPoint =
    base.depth > EPSILON ? { x: base.x, y: base.y } : { x: centerX, y: maxY };
  const depth = base.depth > EPSILON ? base.depth : orbit.distance;
  const scale = pixelsPerWorldUnit(basis, viewport, depth);

  return {
    id,
    kind,
    cell,
    world,
    screen: {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX,
      centerY,
    },
    center: { x: centerX, y: centerY },
    anchor,
    centerLiftPx: anchor.y - centerY,
    viewport,
    camera: {
      azimuth: orbit.azimuth,
      elevation: orbit.elevation,
      distance: orbit.distance,
      fov: cameraConfig.fov,
      target: orbit.target,
    },
    depth,
    pixelsPerWorldUnit: scale,
    approxWorldWidth: (maxX - minX) / scale,
    approxWorldHeight: (maxY - minY) / scale,
    particleCount: count,
    sampled: sampled && count > 0,
    onScreen: maxX > 0 && minX < viewport.width && maxY > 0 && minY < viewport.height,
    capturedAt: Date.now(),
  };
}

/** Same measurement, reading the object, camera and fire tuning from stores. */
export function getModelScreenBounds(
  id: SurfaceObjectId,
  viewport: Viewport,
): ModelScreenBounds | null {
  const object = useSurfaceObjectsStore.getState().byId[id];

  if (object === undefined) {
    return null;
  }

  return modelScreenBounds({
    id,
    kind: object.kind,
    cell: object.cell,
    viewport,
    orbit: useCameraStore.getState().orbit,
    extents: fireModelExtents(useFireSettingsStore.getState().settings),
  });
}
