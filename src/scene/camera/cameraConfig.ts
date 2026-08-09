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

/** World height the screen spans at a given distance from the camera. */
export function visibleWorldHeight(distance: number): number {
  const fovRad = cameraConfig.fov * DEG_TO_RAD;
  return 2 * distance * Math.tan(fovRad / 2);
}

/**
 * Legacy inspect offset: guesses the open band from a hard-coded fraction.
 *
 * Kept as the fallback for the first tap of a session, before the details
 * sheet has ever laid out and there is nothing real to measure.
 */
export function inspectTargetYOffset(distance: number, occupiedFraction: number): number {
  const openBandPosition = occupiedFraction * 0.22;
  return visibleWorldHeight(distance) * openBandPosition;
}

export type InspectFramingMeasurements = {
  /** Distance the camera will hold once the inspect tour lands. */
  readonly focusDistance: number;
  readonly screenHeight: number;
  /** Top edge of the details sheet, px from the top of the display. */
  readonly sheetTopPx: number;
  /** Gap between the model's base and its visual centre, px, at focus distance. */
  readonly objectCenterLiftPx: number;
};

/**
 * Drop the camera target so the model's measured centre lands in the middle of
 * the free band between the top of the display and the top of the sheet.
 *
 * Because `orbitPosition` derives the camera from the target, lowering the
 * target translates the whole rig down: a world offset maps to screen pixels
 * exactly, no small-angle hand-waving required.
 */
export function inspectTargetYOffsetFor(framing: InspectFramingMeasurements): number {
  const { focusDistance, screenHeight, sheetTopPx, objectCenterLiftPx } = framing;

  if (screenHeight <= 0 || focusDistance <= 0) {
    return 0;
  }

  const worldHeight = visibleWorldHeight(focusDistance);
  const bandCenterPx = Math.max(0, sheetTopPx) / 2;
  const naturalCenterPx = screenHeight / 2 - objectCenterLiftPx;
  const shiftPx = naturalCenterPx - bandCenterPx;
  const offset = (shiftPx / screenHeight) * worldHeight;

  return Math.min(worldHeight * 0.45, Math.max(0, offset));
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
