import { cameraMotion } from '@/design-system/motion/camera';
import { SURFACE_CELL_SIZE_PX, SURFACE_CELL_WORLD_SIZE } from '@/scene/surface/constants';

const DEG_TO_RAD = Math.PI / 180;

export const cameraConfig = {
  fov: cameraMotion.fov,
  defaultElevationRad: cameraMotion.defaultElevationDeg * DEG_TO_RAD,
  zoomSensitivity: cameraMotion.zoomSensitivity,
  near: 0.1,
  far: 500,
} as const;

export function defaultCameraDistance(_screenHeight: number, visibleRows: number): number {
  const fovRad = cameraConfig.fov * DEG_TO_RAD;
  const visibleHeight = visibleRows * SURFACE_CELL_WORLD_SIZE;
  return visibleHeight / (2 * Math.tan(fovRad / 2));
}

export function defaultVisibleRows(screenHeight: number): number {
  return Math.max(1, screenHeight / SURFACE_CELL_SIZE_PX);
}

/** World height the camera sees at `distance`. */
export function visibleWorldHeight(distance: number): number {
  const fovRad = cameraConfig.fov * DEG_TO_RAD;
  return 2 * distance * Math.tan(fovRad / 2);
}

/**
 * @deprecated Superseded by {@link inspectTargetY}, which frames the model's
 * own centre instead of its base. Kept so existing callers and tests keep
 * compiling while they migrate.
 */
export function inspectTargetYOffset(distance: number, occupiedFraction: number): number {
  const openBandPosition = occupiedFraction * 0.22;
  return visibleWorldHeight(distance) * openBandPosition;
}

/**
 * Centre of the free band between the top of the display and the top of the
 * sheet, as a fraction of screen height measured from the top.
 */
export function freeBandCenterFraction(sheetScreenFraction: number): number {
  const occupied = Math.min(Math.max(sheetScreenFraction, 0), 1);
  return (1 - occupied) / 2;
}

/**
 * Look-at height that lands `modelCenterY` in the middle of that free band.
 *
 * Two things the old fraction-of-a-fraction guess got wrong. First, the target
 * of the framing is the centre of the model's hitbox, not the point where it
 * touches the surface — a tall flame framed by its base always sits too low.
 * Second, dropping the look-at point translates the whole rig vertically in
 * world space, but the screen only sees the component of that translation along
 * the camera's up axis, so the offset has to be divided by cos(elevation).
 */
export function inspectTargetY(
  modelCenterY: number,
  distance: number,
  elevation: number,
  sheetScreenFraction: number,
): number {
  const liftFraction = 0.5 - freeBandCenterFraction(sheetScreenFraction);
  const cosElevation = Math.max(Math.cos(elevation), 0.15);

  return modelCenterY - (visibleWorldHeight(distance) * liftFraction) / cosElevation;
}

export function orbitPosition(orbit: {
  readonly azimuth: number;
  readonly elevation: number;
  readonly distance: number;
  readonly target: { readonly x: number; readonly y: number; readonly z: number };
}): { readonly x: number; readonly y: number; readonly z: number } {
  const horizontal = orbit.distance * Math.cos(orbit.elevation);
  const x = orbit.target.x + horizontal * Math.sin(orbit.azimuth);
  const y = orbit.target.y + orbit.distance * Math.sin(orbit.elevation);
  const z = orbit.target.z + horizontal * Math.cos(orbit.azimuth);
  return { x, y, z };
}

export function panDeltaFromScreen(changeX: number, changeY: number, azimuth: number, elevation: number, worldPerPixel: number): { readonly x: number; readonly z: number } {
  const sinElev = Math.max(Math.sin(elevation), 0.087);
  const verticalScale = 1 / sinElev;
  const forwardX = -Math.sin(azimuth);
  const forwardZ = -Math.cos(azimuth);
  const rightX = Math.cos(azimuth);
  const rightZ = -Math.sin(azimuth);
  const scaledY = changeY * verticalScale;
  return { x: (forwardX * scaledY - rightX * changeX) * worldPerPixel, z: (forwardZ * scaledY - rightZ * changeX) * worldPerPixel };
}

export function worldUnitsPerPixel(distance: number, screenHeight: number): number {
  return visibleWorldHeight(distance) / Math.max(screenHeight, 1);
}
