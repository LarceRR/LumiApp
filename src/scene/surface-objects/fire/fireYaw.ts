export const FIRE_YAW_LIMIT_DEG = 12;
export const FIRE_YAW_LIMIT_RAD = (FIRE_YAW_LIMIT_DEG * Math.PI) / 180;

export function hashUnit(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0) / 4294967296;
}

/** Deterministic subtle yaw angle for a fire instance (radians). */
export function fireYawRadians(id: string): number {
  const u = hashUnit(id);
  return (u * 2 - 1) * FIRE_YAW_LIMIT_RAD;
}
