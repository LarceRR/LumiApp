/**
 * Preferred camera-facing axis for an object after yaw.
 * Radially symmetric objects have no authored face; local +X stays the
 * convention so spawn / inspect framing is deterministic with `objectYawRadians`.
 */
export const OBJECT_LOCAL_FACE_NORMAL = { x: 1, z: 0 } as const;

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
  localFaceNormal: { readonly x: number; readonly z: number } = OBJECT_LOCAL_FACE_NORMAL,
): number {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const worldX = localFaceNormal.x * cos + localFaceNormal.z * sin;
  const worldZ = -localFaceNormal.x * sin + localFaceNormal.z * cos;

  return Math.atan2(worldX, worldZ);
}

/**
 * The inverse: the yaw an object must take to face a camera already sitting at
 * `orbitAzimuth`.
 *
 * Used by inspect, where the camera holds its heading and the object turns
 * instead — moving the world around the viewer reads as a UI transition, while
 * turning the object reads as the object noticing you.
 */
export function objectYawFacingCamera(
  orbitAzimuth: number,
  localFaceNormal: { readonly x: number; readonly z: number } = OBJECT_LOCAL_FACE_NORMAL,
): number {
  return orbitAzimuth - Math.atan2(localFaceNormal.x, localFaceNormal.z);
}
