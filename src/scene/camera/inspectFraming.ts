import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import type { ModelExtents } from '@/scene/objects/core/modelExtents';
import { screenBoxBounds, type ScreenBox } from '@/scene/objects/core/screenBoxBounds';
import { clamp } from '@/shared/utils/math';

import { orbitScreenBasis, type Viewport, type WorldVector } from './cameraConfig';
import type { FreeZone } from './freeZone';

/** Projected height is roughly 1/distance, so the fit converges in a few passes. */
const FIT_PASSES = 4;
/** The first centring shift is exact to a pixel; the rest kill perspective rounding. */
const CENTERING_PASSES = 3;
const CENTERED_ENOUGH_PX = 0.1;
const FIT_SETTLED = 1e-4;

export type InspectFramingInput = {
  readonly world: WorldVector;
  readonly extents: ModelExtents;
  readonly viewport: Viewport;
  readonly azimuth: number;
  /** Inspect keeps the angle the user is looking from, straight down included. */
  readonly elevation: number;
  readonly freeZone: FreeZone;
  readonly startDistance: number;
  readonly minDistance: number;
  readonly maxDistance: number;
  readonly fitFraction?: number;
};

export type InspectFraming = {
  readonly distance: number;
  readonly elevation: number;
  readonly target: WorldVector;
  /** Share of the free zone height the model ends up covering. */
  readonly fill: number;
  /** Where the model's box will sit — the free zone centre, when nothing clamps. */
  readonly centerY: number;
  /** True when the zoom limits stopped the fit short of the requested share. */
  readonly clamped: boolean;
};

function measure(
  input: InspectFramingInput,
  distance: number,
  target: WorldVector,
): ScreenBox | null {
  return screenBoxBounds(
    input.world,
    input.extents,
    input.viewport,
    orbitScreenBasis(
      { azimuth: input.azimuth, elevation: input.elevation, distance, target },
      input.viewport,
    ),
  );
}

/**
 * Where the camera has to sit for a model to own the free zone.
 *
 * Two independent problems, solved in order and both by measuring rather than
 * guessing:
 *
 * 1. Size. The model's projected box is measured at a trial distance and the
 *    distance is scaled by how far off the wanted height it is. Because the box
 *    is a real projection, this works the same for a tall flame at 20 degrees
 *    and for its footprint straight down.
 * 2. Position. Sliding the orbit target along screen-up translates the camera
 *    without turning it: depth (and therefore scale) is untouched and the model
 *    moves by exactly `shift * pixelsPerWorldUnit` pixels. That is why the box
 *    centre can be put *on* the free-zone centre instead of near it — and why it
 *    still works looking straight down, where the shift comes out horizontal.
 */
export function solveInspectFraming(input: InspectFramingInput): InspectFraming {
  const fitFraction = input.fitFraction ?? surfaceObjectMotion.inspect.fitFraction;
  const wantedPx = input.freeZone.height * fitFraction;
  let distance = clamp(input.startDistance, input.minDistance, input.maxDistance);
  let clamped = false;

  for (let pass = 0; pass < FIT_PASSES; pass += 1) {
    const box = measure(input, distance, input.world);

    if (box === null || wantedPx <= 0 || box.rect.height <= 0) {
      break;
    }

    const wanted = distance * (box.rect.height / wantedPx);
    const next = clamp(wanted, input.minDistance, input.maxDistance);
    const settled = Math.abs(next - distance) < FIT_SETTLED;

    clamped = Math.abs(next - wanted) > FIT_SETTLED;
    distance = next;

    if (settled) {
      break;
    }
  }

  let target: WorldVector = { ...input.world };
  let box = measure(input, distance, target);

  for (let pass = 0; pass < CENTERING_PASSES && box !== null; pass += 1) {
    const shiftPx = input.freeZone.centerY - box.rect.centerY;

    if (Math.abs(shiftPx) < CENTERED_ENOUGH_PX) {
      break;
    }

    const shift = shiftPx / box.pixelsPerWorldUnit;
    const { up } = box.basis;

    target = {
      x: target.x + up.x * shift,
      y: target.y + up.y * shift,
      z: target.z + up.z * shift,
    };
    box = measure(input, distance, target);
  }

  return {
    distance,
    elevation: input.elevation,
    target,
    fill: box === null || input.freeZone.height <= 0 ? 0 : box.rect.height / input.freeZone.height,
    centerY: box === null ? input.freeZone.centerY : box.rect.centerY,
    clamped,
  };
}
