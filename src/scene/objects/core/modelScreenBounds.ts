import { useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';
import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';
import type { SurfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';
import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import {
  cameraConfig,
  type OrbitFrame,
  orbitScreenBasis,
  pixelsPerWorldUnit,
  projectPoint,
  type ProjectedPoint,
  type Viewport,
  type WorldVector,
} from '@/scene/camera/cameraConfig';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { cellToWorld, type WorldPoint } from '@/scene/surface/cellToWorld';

import {
  extentsFromPixels,
  type ModelExtents,
  modelExtentsForKind,
  sanitizeExtents,
} from './modelExtents';
import { screenBoxBounds, type ScreenRect } from './screenBoxBounds';

export type { ProjectedPoint, Viewport };

export type ScreenPoint = { readonly x: number; readonly y: number };

export type ModelScreenBounds = {
  readonly id: SurfaceObjectId;
  readonly kind: SurfaceObjectKind;
  readonly cell: Cell;
  readonly world: WorldPoint;
  readonly screen: ScreenRect;
  readonly center: ScreenPoint;
  /** Where the model meets the surface. */
  readonly anchor: ScreenPoint;
  /** Pixels from the footing up to the box centre. */
  readonly centerLiftPx: number;
  readonly viewport: Viewport;
  readonly camera: {
    readonly azimuth: number;
    readonly elevation: number;
    readonly distance: number;
    readonly fov: number;
    readonly target: WorldVector;
  };
  readonly depth: number;
  readonly pixelsPerWorldUnit: number;
  readonly approxWorldWidth: number;
  readonly approxWorldHeight: number;
  readonly extents: ModelExtents;
  /** True when the pixel sliders authored this box instead of the model. */
  readonly manual: boolean;
  readonly onScreen: boolean;
  readonly capturedAt: number;
};

export type ModelBoundsInput = {
  readonly id: SurfaceObjectId;
  readonly kind: SurfaceObjectKind;
  readonly cell: Cell;
  readonly viewport: Viewport;
  readonly orbit: OrbitFrame;
  /** Pass measured extents to skip resolution (and any manual override). */
  readonly extents?: ModelExtents;
};

export type ResolvedExtents = {
  readonly extents: ModelExtents;
  readonly manual: boolean;
};

/**
 * How big the model is, in world units.
 *
 * Normally the kind answers that itself. The two pixel sliders only win when the
 * manual switch is on, and even then the numbers are converted to world units at
 * the object's own depth, so nothing downstream has to care where they came from.
 */
export function resolveModelExtents(
  kind: SurfaceObjectKind,
  perWorldUnit: number,
): ResolvedExtents {
  const settings = useSettingsStore.getState();

  if (!settings.manualHitbox) {
    return { extents: modelExtentsForKind(kind), manual: false };
  }

  return {
    extents: extentsFromPixels(settings.hitboxWidthPx, settings.hitboxHeightPx, perWorldUnit),
    manual: true,
  };
}

export function modelScreenBounds(input: ModelBoundsInput): ModelScreenBounds | null {
  const { id, kind, cell, viewport, orbit } = input;

  if (viewport.width <= 0 || viewport.height <= 0) {
    return null;
  }

  const world = cellToWorld(cell);
  const basis = orbitScreenBasis(orbit, viewport);
  const anchor = projectPoint(basis, viewport, world);

  if (!anchor.onScreen) {
    return null;
  }

  const perWorldUnit = pixelsPerWorldUnit(viewport.height, anchor.depth, basis.tanHalf);
  const resolved =
    input.extents === undefined
      ? resolveModelExtents(kind, perWorldUnit)
      : { extents: sanitizeExtents(input.extents), manual: false };
  const box = screenBoxBounds(world, resolved.extents, viewport, basis);

  if (box === null) {
    return null;
  }

  return {
    id,
    kind,
    cell,
    world,
    screen: box.rect,
    center: { x: box.rect.centerX, y: box.rect.centerY },
    anchor: { x: anchor.x, y: anchor.y },
    centerLiftPx: anchor.y - box.rect.centerY,
    viewport,
    camera: {
      azimuth: orbit.azimuth,
      elevation: orbit.elevation,
      distance: orbit.distance,
      fov: cameraConfig.fov,
      target: orbit.target,
    },
    depth: box.depth,
    pixelsPerWorldUnit: box.pixelsPerWorldUnit,
    approxWorldWidth: box.rect.width / box.pixelsPerWorldUnit,
    approxWorldHeight: box.rect.height / box.pixelsPerWorldUnit,
    extents: resolved.extents,
    manual: resolved.manual,
    onScreen: true,
    capturedAt: Date.now(),
  };
}

export function getModelScreenBounds(
  id: SurfaceObjectId,
  viewport: Viewport,
  orbit: OrbitFrame = useCameraStore.getState().orbit,
  extents?: ModelExtents,
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
    orbit,
    ...(extents === undefined ? {} : { extents }),
  });
}

export function projectWorldToScreen(
  point: WorldPoint,
  viewport: Viewport,
  orbit: OrbitFrame,
): ProjectedPoint {
  return projectPoint(orbitScreenBasis(orbit, viewport), viewport, point);
}
