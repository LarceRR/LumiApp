import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { clamp } from '@/shared/utils/math';

import { surfaceObjectDefinition } from './objectRegistry';

/**
 * World-space envelope of one model, measured from its footing on the surface.
 *
 * `height` runs up from the cell, `halfWidth` is the radius on both ground axes.
 * Every object stands upright in a single cell, so a square-footed upright box
 * is enough to frame anything the catalog will hold — and it needs no yaw, which
 * keeps framing stable while an object turns to face the camera.
 */
export type ModelExtents = {
  readonly halfWidth: number;
  readonly height: number;
};

/** Fallback for kinds that ship no measurement: half a cell wide, most of one tall. */
export const DEFAULT_MODEL_EXTENTS: ModelExtents = { halfWidth: 0.25, height: 0.6 };

export function sanitizeExtents(extents: ModelExtents): ModelExtents {
  return {
    halfWidth: Math.max(1e-3, extents.halfWidth),
    height: Math.max(1e-3, extents.height),
  };
}

/**
 * Ask the kind how big it is.
 *
 * Framing never guesses and never knows what a fire is: each object describes
 * its own envelope once, in its definition, and the camera reads it from the
 * registry. New models in the catalog get correct framing for free.
 */
export function modelExtentsForKind(kind: SurfaceObjectKind): ModelExtents {
  const measured = surfaceObjectDefinition(kind)?.measureExtents();

  return sanitizeExtents(measured ?? DEFAULT_MODEL_EXTENTS);
}

/**
 * Quantile of a uniform range.
 *
 * Models are authored as random ranges (particle speed, life, size). Taking a
 * high quantile instead of the maximum is what keeps one stray spark from
 * inflating the box, without any need to look at live particles.
 */
export function rangeQuantile(min: number, max: number, quantile: number): number {
  return min + (max - min) * clamp(quantile, 0, 1);
}

/** Pixel-authored box (debug override) expressed in world units. */
export function extentsFromPixels(
  widthPx: number,
  heightPx: number,
  pixelsPerWorldUnit: number,
): ModelExtents {
  const scale = Math.max(pixelsPerWorldUnit, 1e-6);

  return sanitizeExtents({ halfWidth: widthPx / 2 / scale, height: heightPx / scale });
}
