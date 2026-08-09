import { clamp, dampOverMs } from '@/shared/utils/math';

import type { FireWindSettings } from './fireSettings';

/** World-space wind vector: direction and magnitude in one value. */
export type PanGust = {
  readonly x: number;
  readonly z: number;
};

export const ZERO_GUST: PanGust = { x: 0, z: 0 };

export const PAN_WIND = {
  /** Pan speed, world units per second, that produces a full-strength gust. */
  referenceSpeed: 5,
  /** Cap, in the same units as the authored `wind.strength`. */
  maxStrength: 1.4,
  /** Gusts build fast and die slowly. That asymmetry is what reads as air. */
  attackMs: 110,
  releaseMs: 520,
  /** Height band the gust acts over, emitter-local units. */
  maxHeight: 2.5,
  /** Below this a still camera never nudges a fire. */
  deadZoneSpeed: 0.02,
} as const;

/**
 * The surface never actually moves, but sweeping the camera across it reads as
 * travelling. Air resists travel, so the gust points against the sweep.
 */
export function panGustVector(deltaX: number, deltaZ: number, deltaSeconds: number): PanGust {
  if (deltaSeconds <= 0) {
    return ZERO_GUST;
  }

  const speedX = deltaX / deltaSeconds;
  const speedZ = deltaZ / deltaSeconds;
  const speed = Math.hypot(speedX, speedZ);

  if (speed <= PAN_WIND.deadZoneSpeed) {
    return ZERO_GUST;
  }

  const strength = clamp(speed / PAN_WIND.referenceSpeed, 0, 1) * PAN_WIND.maxStrength;

  return { x: (-speedX / speed) * strength, z: (-speedZ / speed) * strength };
}

/**
 * Damped as a vector rather than as an angle: no wrap-around at 360 degrees,
 * and the direction can swing through zero instead of spinning the long way.
 */
export function dampPanGust(current: PanGust, target: PanGust, deltaSeconds: number): PanGust {
  const rising = Math.hypot(target.x, target.z) > Math.hypot(current.x, current.z);
  const fadeMs = rising ? PAN_WIND.attackMs : PAN_WIND.releaseMs;

  return {
    x: dampOverMs(current.x, target.x, fadeMs, deltaSeconds),
    z: dampOverMs(current.z, target.z, fadeMs, deltaSeconds),
  };
}

/**
 * Authored wind stays in play; the gust is summed on top as a vector, so the
 * settings implementation still works even though its UI is gone.
 */
export function panWindSettings(gust: PanGust, base: FireWindSettings): FireWindSettings {
  const baseRadians = (base.direction * Math.PI) / 180;
  const x = Math.cos(baseRadians) * base.strength + gust.x;
  const z = Math.sin(baseRadians) * base.strength + gust.z;
  const strength = Math.hypot(x, z);

  if (strength <= 1e-4) {
    return base;
  }

  return {
    strength,
    direction: ((Math.atan2(z, x) * 180) / Math.PI + 360) % 360,
    minHeight: base.minHeight,
    maxHeight: Math.max(base.maxHeight, PAN_WIND.maxHeight),
  };
}
