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
export function inspectTargetYOffset(distance: number, occupiedFraction: number): number {
  return visibleWorldHeight(distance) * occupiedFraction * 0.22;
}
export type InspectFramingMeasurements = {
  readonly focusDistance: number;
  readonly screenHeight: number;
  readonly sheetTopPx: number;
  readonly objectCenterLiftPx: number;
};
export function inspectTargetYOffsetFor({
  focusDistance,
  screenHeight,
  sheetTopPx,
  objectCenterLiftPx,
}: InspectFramingMeasurements): number {
  if (screenHeight <= 0 || focusDistance <= 0) return 0;
  const worldHeight = visibleWorldHeight(focusDistance);
  const bandCenterPx = Math.max(0, sheetTopPx) / 2;
  const naturalCenterPx = screenHeight / 2 - objectCenterLiftPx;
  return Math.min(
    worldHeight * 0.45,
    Math.max(0, ((naturalCenterPx - bandCenterPx) / screenHeight) * worldHeight),
  );
}
export function elevationForDistance(distance: number, defaultDistance: number): number {
  const min = defaultDistance * cameraMotion.minDistanceFactor;
  const max = defaultDistance * cameraMotion.maxDistanceFactor;
  const progress = Math.min(1, Math.max(0, (distance - min) / Math.max(max - min, 1e-6)));
  return (
    (cameraMotion.minElevationDeg +
      progress * (cameraMotion.maxElevationDeg - cameraMotion.minElevationDeg)) *
    DEG_TO_RAD
  );
}
export function orbitPosition(orbit: {
  readonly azimuth: number;
  readonly elevation: number;
  readonly distance: number;
  readonly target: { readonly x: number; readonly y: number; readonly z: number };
}): { readonly x: number; readonly y: number; readonly z: number } {
  const horizontal = orbit.distance * Math.cos(orbit.elevation);
  return {
    x: orbit.target.x + horizontal * Math.sin(orbit.azimuth),
    y: orbit.target.y + orbit.distance * Math.sin(orbit.elevation),
    z: orbit.target.z + horizontal * Math.cos(orbit.azimuth),
  };
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
