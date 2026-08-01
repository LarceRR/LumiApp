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

/** Distance so one cell spans ~SURFACE_CELL_SIZE_PX at the given viewport height. */
export function defaultCameraDistance(_screenHeight: number, visibleRows: number): number {
  const fovRad = cameraConfig.fov * DEG_TO_RAD;
  const visibleHeight = visibleRows * SURFACE_CELL_WORLD_SIZE;
  return visibleHeight / (2 * Math.tan(fovRad / 2));
}

/** Rows visible at default zoom — ties world cell size to screen pixels. */
export function defaultVisibleRows(screenHeight: number): number {
  return Math.max(1, screenHeight / SURFACE_CELL_SIZE_PX);
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

/**
 * Screen-pixel pan → world XZ delta, relative to camera facing and elevation.
 * Map-style drag: finger and surface move together on screen
 * (look-at shifts opposite to the finger).
 */
export function panDeltaFromScreen(
  changeX: number,
  changeY: number,
  azimuth: number,
  elevation: number,
  worldPerPixel: number,
): { readonly x: number; readonly z: number } {
  const sinElev = Math.max(Math.sin(elevation), 0.087);
  const verticalScale = 1 / sinElev;

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

/** World units represented by one screen pixel at the current framing. */
export function worldUnitsPerPixel(distance: number, screenHeight: number): number {
  const fovRad = cameraConfig.fov * DEG_TO_RAD;
  const visibleHeight = 2 * distance * Math.tan(fovRad / 2);
  return visibleHeight / Math.max(screenHeight, 1);
}
