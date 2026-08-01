export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

/**
 * Frame-rate independent exponential smoothing. `smoothing` is the fraction of
 * the remaining distance left after one second.
 */
export function damp(current: number, target: number, smoothing: number, delta: number): number {
  return lerp(target, current, smoothing ** delta);
}

/**
 * Damp toward `target` so ~95% of the gap closes within `fadeMs`.
 * Safe for interruptible UI fades (dim in/out, etc.).
 */
export function dampOverMs(
  current: number,
  target: number,
  fadeMs: number,
  deltaSeconds: number,
): number {
  if (fadeMs <= 0 || deltaSeconds <= 0) {
    return target;
  }

  const smoothing = Math.exp(-3 / (fadeMs / 1000));
  return damp(current, target, smoothing, deltaSeconds);
}

export function shortestAngleDelta(from: number, to: number): number {
  const tau = Math.PI * 2;
  const difference = ((((to - from + Math.PI) % tau) + tau) % tau) - Math.PI;

  return difference;
}

/** Deterministic hash → [0, 1). Keeps per-object variation stable across renders. */
export function hashToUnit(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return ((hash >>> 0) % 100000) / 100000;
}
