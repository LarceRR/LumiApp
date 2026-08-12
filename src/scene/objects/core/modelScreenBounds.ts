import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';
import type { SurfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { cameraConfig, orbitPosition } from '@/scene/camera/cameraConfig';
import type { FireSettings } from '@/scene/objects/fire/fireSettings';
import { useFireSettingsStore } from '@/scene/objects/fire/fireSettingsStore';
import type { OrbitState, OrbitTarget } from '@/scene/stores/cameraStore';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { cellToWorld, type WorldPoint } from '@/scene/surface/cellToWorld';
import { useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';
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
  readonly depth: number;
  readonly onScreen: boolean;
};
export type ModelExtents = { readonly halfWidth: number; readonly height: number };
export type ModelScreenBounds = {
  readonly id: SurfaceObjectId;
  readonly kind: string;
  readonly cell: Cell;
  readonly world: WorldPoint;
  readonly screen: ScreenRect;
  readonly center: ScreenPoint;
  readonly anchor: ScreenPoint;
  readonly centerLiftPx: number;
  readonly viewport: Viewport;
  readonly camera: {
    readonly azimuth: number;
    readonly elevation: number;
    readonly distance: number;
    readonly fov: number;
    readonly target: OrbitTarget;
  };
  readonly depth: number;
  readonly pixelsPerWorldUnit: number;
  readonly approxWorldWidth: number;
  readonly approxWorldHeight: number;
  readonly particleCount: number;
  readonly sampled: boolean;
  readonly onScreen: boolean;
  readonly capturedAt: number;
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
  if (rl < 1e-6) {
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
    tanHalf: Math.tan((cameraConfig.fov * Math.PI) / 180 / 2),
    aspect: viewport.width / Math.max(viewport.height, 1),
  };
}
function project(
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
  if (depth <= 1e-6) return { x: Number.NaN, y: Number.NaN, depth, onScreen: false };
  const right = vx * basis.rx + vy * basis.ry + vz * basis.rz;
  const up = vx * basis.ux + vy * basis.uy + vz * basis.uz;
  const ndcX = right / (depth * basis.tanHalf * basis.aspect);
  const ndcY = up / (depth * basis.tanHalf);
  return {
    x: ((ndcX + 1) / 2) * viewport.width,
    y: ((1 - ndcY) / 2) * viewport.height,
    depth,
    onScreen: true,
  };
}
export function modelScreenBounds(input: ModelBoundsInput): ModelScreenBounds | null {
  const { id, kind, cell, viewport, orbit } = input;
  if (viewport.width <= 0 || viewport.height <= 0) return null;
  const world = cellToWorld(cell);
  const basis = cameraBasis(orbit, viewport);
  const widthPx = useSettingsStore.getState().hitboxWidthPx;
  const heightPx = useSettingsStore.getState().hitboxHeightPx;
  const anchor = project(basis, viewport, world.x, world.y, world.z);
  if (!anchor.onScreen) return null;
  const screen = {
    minX: anchor.x - widthPx / 2,
    minY: anchor.y - heightPx,
    maxX: anchor.x + widthPx / 2,
    maxY: anchor.y,
    width: widthPx,
    height: heightPx,
    centerX: anchor.x,
    centerY: anchor.y - heightPx / 2,
  };
  const depth = anchor.depth;
  const scale = viewport.height / (2 * Math.max(depth, 1e-6) * basis.tanHalf);
  return {
    id,
    kind,
    cell,
    world,
    screen,
    center: { x: screen.centerX, y: screen.centerY },
    anchor: { x: anchor.x, y: anchor.y },
    centerLiftPx: heightPx / 2,
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
    approxWorldWidth: widthPx / scale,
    approxWorldHeight: heightPx / scale,
    particleCount: 0,
    sampled: false,
    onScreen: true,
    capturedAt: Date.now(),
  };
}
export type ModelBoundsInput = {
  readonly id: SurfaceObjectId;
  readonly kind: string;
  readonly cell: Cell;
  readonly viewport: Viewport;
  readonly orbit: OrbitState;
  readonly extents: ModelExtents;
};
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
export function projectWorldToScreen(
  point: WorldPoint,
  viewport: Viewport,
  orbit: OrbitState,
): ProjectedPoint {
  return project(cameraBasis(orbit, viewport), viewport, point.x, point.y, point.z);
}
export function getModelScreenBounds(
  id: SurfaceObjectId,
  viewport: Viewport,
): ModelScreenBounds | null {
  const object = useSurfaceObjectsStore.getState().byId[id];
  if (!object) return null;
  return modelScreenBounds({
    id,
    kind: object.kind,
    cell: object.cell,
    viewport,
    orbit: useCameraStore.getState().orbit,
    extents: fireModelExtents(useFireSettingsStore.getState().settings),
  });
}
