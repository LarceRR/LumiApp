import { cameraMotion } from '@/design-system/motion/camera';
import { SURFACE_CELL_SIZE_PX, SURFACE_CELL_WORLD_SIZE } from '@/scene/surface/constants';
import { clamp } from '@/shared/utils/math';

const DEG_TO_RAD = Math.PI / 180;

export const cameraConfig = {
  fov: cameraMotion.fov,
  defaultElevationRad: cameraMotion.defaultElevationDeg * DEG_TO_RAD,
  zoomSensitivity: cameraMotion.zoomSensitivity,
  near: 0.1,
  far: 500,
} as const;

export const MIN_ELEVATION_RAD = cameraMotion.minElevationDeg * DEG_TO_RAD;
export const MAX_ELEVATION_RAD = cameraMotion.maxElevationDeg * DEG_TO_RAD;

/**
 * Elevation the projection is allowed to use.
 *
 * At exactly 90 degrees the camera looks along world up: `lookAt` has no roll
 * reference and `right = forward x worldUp` degenerates, so screen-right silently
 * fell back to world +X and lost the azimuth. That single line is what made the
 * surface stutter while rotating, drag the wrong way and swallow taps top-down.
 * Stopping a fraction of a degree short fixes all of it and is invisible, so
 * state can keep holding a round 90.
 */
export const RENDER_MAX_ELEVATION_RAD =
  (cameraMotion.maxElevationDeg - cameraMotion.elevationSafetyDeg) * DEG_TO_RAD;

export function renderElevation(elevation: number): number {
  return clamp(elevation, MIN_ELEVATION_RAD, RENDER_MAX_ELEVATION_RAD);
}

export type WorldVector = { readonly x: number; readonly y: number; readonly z: number };

/** Just enough of the orbit state to place and orient the camera. */
export type OrbitFrame = {
  readonly azimuth: number;
  readonly elevation: number;
  readonly distance: number;
  readonly target: WorldVector;
};

export type Viewport = { readonly width: number; readonly height: number };

export type ProjectedPoint = {
  readonly x: number;
  readonly y: number;
  readonly depth: number;
  readonly onScreen: boolean;
};

/** Camera position and its screen axes — all screen-space maths starts here. */
export type ScreenBasis = {
  readonly camera: WorldVector;
  readonly forward: WorldVector;
  readonly right: WorldVector;
  readonly up: WorldVector;
  readonly tanHalf: number;
  readonly aspect: number;
};

export function defaultCameraDistance(_screenHeight: number, visibleRows: number): number {
  return (
    (visibleRows * SURFACE_CELL_WORLD_SIZE) / (2 * Math.tan((cameraConfig.fov * DEG_TO_RAD) / 2))
  );
}

export function defaultVisibleRows(screenHeight: number): number {
  return Math.max(1, screenHeight / SURFACE_CELL_SIZE_PX);
}

export function visibleWorldHeight(distance: number): number {
  return 2 * distance * Math.tan((cameraConfig.fov * DEG_TO_RAD) / 2);
}

export function elevationForDistance(distance: number, defaultDistance: number): number {
  const min = defaultDistance * cameraMotion.minDistanceFactor;
  const max = defaultDistance * cameraMotion.maxDistanceFactor;
  const progress = clamp((distance - min) / Math.max(max - min, 1e-6), 0, 1);

  return (
    (cameraMotion.minElevationDeg +
      progress * (cameraMotion.maxElevationDeg - cameraMotion.minElevationDeg)) *
    DEG_TO_RAD
  );
}

export function orbitPosition(orbit: OrbitFrame): WorldVector {
  const elevation = renderElevation(orbit.elevation);
  const horizontal = orbit.distance * Math.cos(elevation);

  return {
    x: orbit.target.x + horizontal * Math.sin(orbit.azimuth),
    y: orbit.target.y + orbit.distance * Math.sin(elevation),
    z: orbit.target.z + horizontal * Math.cos(orbit.azimuth),
  };
}

/**
 * Screen axes of the orbit camera, in closed form.
 *
 * These are the exact limits of `right = forward x worldUp`, `up = right x
 * forward`, so they agree with the matrix three.js builds from `lookAt` — minus
 * the division by zero that construction hits looking straight down.
 */
export function orbitScreenBasis(orbit: OrbitFrame, viewport: Viewport): ScreenBasis {
  const elevation = renderElevation(orbit.elevation);
  const sinAzimuth = Math.sin(orbit.azimuth);
  const cosAzimuth = Math.cos(orbit.azimuth);
  const sinElevation = Math.sin(elevation);
  const cosElevation = Math.cos(elevation);

  return {
    camera: orbitPosition(orbit),
    forward: { x: -cosElevation * sinAzimuth, y: -sinElevation, z: -cosElevation * cosAzimuth },
    right: { x: cosAzimuth, y: 0, z: -sinAzimuth },
    up: { x: -sinAzimuth * sinElevation, y: cosElevation, z: -cosAzimuth * sinElevation },
    tanHalf: Math.tan((cameraConfig.fov * DEG_TO_RAD) / 2),
    aspect: Math.max(viewport.width, 1) / Math.max(viewport.height, 1),
  };
}

export function projectPoint(
  basis: ScreenBasis,
  viewport: Viewport,
  point: WorldVector,
): ProjectedPoint {
  const vx = point.x - basis.camera.x;
  const vy = point.y - basis.camera.y;
  const vz = point.z - basis.camera.z;
  const depth = vx * basis.forward.x + vy * basis.forward.y + vz * basis.forward.z;

  if (depth <= 1e-6) {
    return { x: Number.NaN, y: Number.NaN, depth, onScreen: false };
  }

  const right = vx * basis.right.x + vy * basis.right.y + vz * basis.right.z;
  const up = vx * basis.up.x + vy * basis.up.y + vz * basis.up.z;
  const ndcX = right / (depth * basis.tanHalf * basis.aspect);
  const ndcY = up / (depth * basis.tanHalf);

  return {
    x: ((ndcX + 1) / 2) * viewport.width,
    y: ((1 - ndcY) / 2) * viewport.height,
    depth,
    onScreen: true,
  };
}

/** Ray-plane hit on y = 0 under a screen point. */
export function screenGroundHit(
  basis: ScreenBasis,
  viewport: Viewport,
  screenX: number,
  screenY: number,
): { readonly x: number; readonly z: number } | null {
  if (viewport.width <= 0 || viewport.height <= 0) {
    return null;
  }

  const ndcX = (screenX / viewport.width) * 2 - 1;
  const ndcY = -((screenY / viewport.height) * 2 - 1);
  const spanX = ndcX * basis.tanHalf * basis.aspect;
  const spanY = ndcY * basis.tanHalf;
  const dirX = basis.forward.x + basis.right.x * spanX + basis.up.x * spanY;
  const dirY = basis.forward.y + basis.right.y * spanX + basis.up.y * spanY;
  const dirZ = basis.forward.z + basis.right.z * spanX + basis.up.z * spanY;
  const length = Math.hypot(dirX, dirY, dirZ) || 1;
  const unitY = dirY / length;

  if (Math.abs(unitY) < 1e-6) {
    return null;
  }

  const travel = -basis.camera.y / unitY;

  if (travel < 0) {
    return null;
  }

  return {
    x: basis.camera.x + (dirX / length) * travel,
    z: basis.camera.z + (dirZ / length) * travel,
  };
}

/** Screen pixels covered by one world unit at `depth`. */
export function pixelsPerWorldUnit(viewportHeight: number, depth: number, tanHalf: number): number {
  return viewportHeight / (2 * Math.max(depth, 1e-6) * Math.max(tanHalf, 1e-6));
}

export function panDeltaFromScreen(
  changeX: number,
  changeY: number,
  azimuth: number,
  elevation: number,
  worldPerPixel: number,
): { readonly x: number; readonly z: number } {
  const verticalScale = 1 / Math.max(Math.sin(elevation), 0.087);
  const forwardX = -Math.sin(azimuth);
  const forwardZ = -Math.cos(azimuth);
  const rightX = Math.cos(azimuth);
  const rightZ = -Math.sin(azimuth);
  const scaledY = changeY * verticalScale;

  return {
    x: (forwardX * scaledY - rightX * changeX) * worldPerPixel,
    z: (forwardZ * scaledY - rightZ * changeX) * worldPerPixel,
  };
}

export function worldUnitsPerPixel(distance: number, screenHeight: number): number {
  return visibleWorldHeight(distance) / Math.max(screenHeight, 1);
}
