import type { OrbitTarget } from '@/scene/stores/cameraStore';

export function easeOutCubic(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  return 1 - (1 - t) ** 3;
}

export function lerpTarget(from: OrbitTarget, to: OrbitTarget, progress: number): OrbitTarget {
  const t = easeOutCubic(progress);

  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t,
  };
}

export function targetDistance(left: OrbitTarget, right: OrbitTarget): number {
  const dx = left.x - right.x;
  const dz = left.z - right.z;

  return Math.hypot(dx, dz);
}
