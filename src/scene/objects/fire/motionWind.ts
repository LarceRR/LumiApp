import type { OrbitTarget } from '@/scene/stores/cameraStore';
import { clamp, dampOverMs } from '@/shared/utils/math';

import type { FireWindSettings } from './fireSettings';

export const MOTION_WIND = {
  /** Pan speed (world units per second) that already produces a full gust. */
  fullSpeed: 5,
  /** Cap, in the same units as `FireWindSettings.strength`. */
  maxStrength: 1.4,
  /** Gusts arrive fast and leave slowly, the way moving air actually behaves. */
  attackMs: 110,
  releaseMs: 620,
  /** Ignore sub-pixel drift so a resting camera never breathes on the fire. */
  minSpeed: 0.05,
} as const;

export type WindVector = {
  readonly strength: number;
  /** Radians on the XZ plane, matching `atan2(z, x)`. */
  readonly directionRad: number;
};

/**
 * Wind derived from how fast the surface is being dragged under the camera.
 *
 * The fires are static in world space; the camera is what moves. In the
 * camera's frame the whole surface travels, so the flames should trail the way
 * they would if the fire were carried through still air. Drag opposes that
 * apparent motion, which works out to the direction the camera target moved.
 */
export class MotionWind {
  private lastX: number | null = null;
  private lastZ: number | null = null;
  private strength = 0;
  private directionRad = 0;

  sample(target: OrbitTarget, deltaSeconds: number): WindVector {
    const previousX = this.lastX;
    const previousZ = this.lastZ;
    this.lastX = target.x;
    this.lastZ = target.z;

    if (previousX === null || previousZ === null || deltaSeconds <= 0) {
      return this.vector();
    }

    const deltaX = target.x - previousX;
    const deltaZ = target.z - previousZ;
    const speed = Math.hypot(deltaX, deltaZ) / deltaSeconds;

    if (speed > MOTION_WIND.minSpeed) {
      this.directionRad = Math.atan2(deltaZ, deltaX);
    }

    const desired = clamp(speed / MOTION_WIND.fullSpeed, 0, 1) * MOTION_WIND.maxStrength;
    const responseMs = desired > this.strength ? MOTION_WIND.attackMs : MOTION_WIND.releaseMs;
    this.strength = dampOverMs(this.strength, desired, responseMs, deltaSeconds);

    return this.vector();
  }

  reset(): void {
    this.lastX = null;
    this.lastZ = null;
    this.strength = 0;
  }

  private vector(): WindVector {
    return { strength: this.strength, directionRad: this.directionRad };
  }
}

/** Authored wind plus the movement gust, summed as vectors on the XZ plane. */
export function combineWind(base: FireWindSettings, motion: WindVector): WindVector {
  const baseRad = (base.direction * Math.PI) / 180;
  const x = base.strength * Math.cos(baseRad) + motion.strength * Math.cos(motion.directionRad);
  const z = base.strength * Math.sin(baseRad) + motion.strength * Math.sin(motion.directionRad);
  const strength = Math.hypot(x, z);

  return {
    strength,
    directionRad: strength < 1e-4 ? motion.directionRad : Math.atan2(z, x),
  };
}
