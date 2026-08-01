/**
 * Unit cubic-bezier easing (CSS-style). Control points (x1,y1,x2,y2) with
 * x in [0,1]. Solves x(t)=progress for the curve parameter, then returns y(t).
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (progress: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number): number => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number): number => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number): number => (3 * ax * t + 2 * bx) * t + cx;

  const solveT = (x: number): number => {
    let t = x;

    for (let iteration = 0; iteration < 8; iteration += 1) {
      const xEstimate = sampleX(t) - x;
      const d = sampleDX(t);

      if (Math.abs(xEstimate) < 1e-6 || Math.abs(d) < 1e-6) {
        break;
      }

      t -= xEstimate / d;
    }

    return Math.min(1, Math.max(0, t));
  };

  return (progress: number): number => {
    const t = Math.min(1, Math.max(0, progress));

    if (t === 0 || t === 1) {
      return t;
    }

    return sampleY(solveT(t));
  };
}

/** Smooth ease-in-out — slow start and finish, used for camera tours. */
export const easeInOutCubicBezier = cubicBezier(0.65, 0, 0.35, 1);

/** Accelerating ease-in — used while the fire rises and spins up. */
export const easeInCubicBezier = cubicBezier(0.55, 0.05, 0.68, 0.2);

/** Soft landing ease — used while the fire settles and spins down. */
export const easeOutCubicBezier = cubicBezier(0.22, 1, 0.36, 1);
