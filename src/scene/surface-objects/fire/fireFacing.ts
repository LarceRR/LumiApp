/**
 * Preferred camera-facing axis for a fire after yaw.
 * Sphere core has no authored face; local +X remains the stable convention
 * so spawn / inspect framing stays deterministic with `fireYawRadians`.
 */
export const FIRE_LOCAL_FACE_NORMAL = { x: 1, z: 0 } as const;

/**
 * Orbit azimuth that places the camera in front of an object.
 *
 * Camera sits at `target + (sin(az)·h, cos(az)·h)` and looks at the target, so the
 * direction from target toward the camera is `(sin(az), cos(az))` on XZ. That must
 * match the object's world-space face normal after yaw around Y:
 *   x' = nx·cos(yaw) + nz·sin(yaw)
 *   z' = -nx·sin(yaw) + nz·cos(yaw)
 */
export function orbitAzimuthFacing(
  yaw: number,
  localFaceNormal: { readonly x: number; readonly z: number } = FIRE_LOCAL_FACE_NORMAL,
): number {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const worldX = localFaceNormal.x * cos + localFaceNormal.z * sin;
  const worldZ = -localFaceNormal.x * sin + localFaceNormal.z * cos;

  return Math.atan2(worldX, worldZ);
}
