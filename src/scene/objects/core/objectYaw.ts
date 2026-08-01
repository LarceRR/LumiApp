import { hashToUnit } from '@/shared/utils/math';

export const OBJECT_YAW_LIMIT_DEG = 12;
export const OBJECT_YAW_LIMIT_RAD = (OBJECT_YAW_LIMIT_DEG * Math.PI) / 180;

/**
 * Deterministic, subtle yaw for one object instance (radians).
 * Same id always lands on the same angle, so framing never jitters.
 */
export function objectYawRadians(id: string): number {
  return (hashToUnit(id) * 2 - 1) * OBJECT_YAW_LIMIT_RAD;
}
