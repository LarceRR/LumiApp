import { describe, expect, it } from 'vitest';

import { easeOutCubic, lerpTarget, targetDistance } from './recenter';

describe('recenter', () => {
  it('lerps target towards map centre with ease-out', () => {
    const from = { x: 0, y: 0, z: 0 };
    const to = { x: 10, y: 0, z: 0 };

    expect(lerpTarget(from, to, 0)).toEqual({ x: 0, y: 0, z: 0 });
    expect(lerpTarget(from, to, 1)).toEqual({ x: 10, y: 0, z: 0 });
    expect(lerpTarget(from, to, 0.5).x).toBeGreaterThan(8);
    expect(lerpTarget(from, to, 0.5).x).toBeLessThan(9);
  });

  it('measures planar distance between targets', () => {
    expect(targetDistance({ x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 4 })).toBe(5);
  });

  it('eases out at the end of the animation', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(easeOutCubic(1)).toBe(1);
  });
});
