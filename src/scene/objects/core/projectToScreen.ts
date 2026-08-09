import { cameraConfig, orbitPosition } from '@/scene/camera/cameraConfig';

import type { OrbitFrame } from './fogVisibility';

export type Vec3 = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
};

export type Viewport = {
  readonly width: number;
  readonly height: number;
};

export type ScreenPoint = {
  readonly x: number;
  readonly y: number;
  /** Distance along the camera forward axis. Always positive when visible. */
  readonly depth: number;
};

export type CameraBasis = {
  readonly position: Vec3;
  readonly forward: Vec3;
  readonly right: Vec3;
  readonly up: Vec3;
  readonly tanHalfFov: number;
  readonly aspect: number;
};

const DEG_TO_RAD = Math.PI / 180;

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * The exact basis `groundHitFromScreen` unprojects with, pulled out so the
 * forward direction (world -> screen) cannot drift away from its inverse.
 */
export function cameraBasis(orbit: OrbitFrame, viewport: Viewport): CameraBasis {
  const position = orbitPosition(orbit);
  const tx = orbit.target.x - position.x;
  const ty = orbit.target.y - position.y;
  const tz = orbit.target.z - position.z;
  const length = Math.hypot(tx, ty, tz) || 1;
  const forward: Vec3 = { x: tx / length, y: ty / length, z: tz / length };

  // right = forward x worldUp, with worldUp = (0, 1, 0)
  let rx = -forward.z;
  let rz = forward.x;
  const rightLength = Math.hypot(rx, rz);

  if (rightLength < 1e-6) {
    rx = 1;
    rz = 0;
  } else {
    rx /= rightLength;
    rz /= rightLength;
  }

  const right: Vec3 = { x: rx, y: 0, z: rz };
  const up: Vec3 = {
    x: right.y * forward.z - right.z * forward.y,
    y: right.z * forward.x - right.x * forward.z,
    z: right.x * forward.y - right.y * forward.x,
  };

  return {
    position,
    forward,
    right,
    up,
    tanHalfFov: Math.tan((cameraConfig.fov * DEG_TO_RAD) / 2),
    aspect: viewport.height <= 0 ? 1 : viewport.width / viewport.height,
  };
}

/** Perspective projection of a world point. `null` when it sits behind the lens. */
export function projectWorldToScreen(
  point: Vec3,
  basis: CameraBasis,
  viewport: Viewport,
): ScreenPoint | null {
  const offset: Vec3 = {
    x: point.x - basis.position.x,
    y: point.y - basis.position.y,
    z: point.z - basis.position.z,
  };
  const depth = dot(offset, basis.forward);

  if (depth <= 1e-4) {
    return null;
  }

  const horizontal = dot(offset, basis.right);
  const vertical = dot(offset, basis.up);
  const ndcX = horizontal / (depth * basis.tanHalfFov * basis.aspect);
  const ndcY = vertical / (depth * basis.tanHalfFov);

  return {
    x: ((ndcX + 1) / 2) * viewport.width,
    y: ((1 - ndcY) / 2) * viewport.height,
    depth,
  };
}

/** Screen points one world unit spans at `depth`. Useful for debug readouts. */
export function pointsPerWorldUnit(
  depth: number,
  basis: CameraBasis,
  viewport: Viewport,
): number {
  const visibleHeight = 2 * depth * basis.tanHalfFov;

  return visibleHeight <= 0 ? 0 : viewport.height / visibleHeight;
}
