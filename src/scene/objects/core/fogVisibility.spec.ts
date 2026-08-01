import { describe, expect, it } from 'vitest';

import { fogFactor, isLostInFog, objectFogFactor, orbitFogBounds, viewDepth } from './fogVisibility';

const orbit = {
  azimuth: 0,
  elevation: 0,
  distance: 10,
  target: { x: 0, y: 0, z: 0 },
} as const;

describe('fogFactor', () => {
  it('is clear before the near plane and lost past the far plane', () => {
    expect(fogFactor(1, 5, 20)).toBe(0);
    expect(fogFactor(25, 5, 20)).toBe(1);
  });

  it('ramps linearly between near and far', () => {
    expect(fogFactor(12.5, 5, 20)).toBeCloseTo(0.5, 5);
  });

  it('degenerates safely when the bounds collapse', () => {
    expect(fogFactor(5, 10, 10)).toBe(0);
    expect(fogFactor(10, 10, 10)).toBe(1);
  });
});

describe('viewDepth', () => {
  it('measures along the look vector, so the target sits at the orbit distance', () => {
    expect(viewDepth({ x: 0, y: 0, z: 0 }, orbit)).toBeCloseTo(orbit.distance, 5);
  });
});

describe('objectFogFactor', () => {
  it('keeps the orbit target clear of the fog', () => {
    const bounds = orbitFogBounds(orbit.distance);

    expect(bounds.near).toBeLessThan(orbit.distance);
    expect(bounds.far).toBeGreaterThan(orbit.distance);
    expect(objectFogFactor({ x: 0, y: 0, z: 0 }, orbit)).toBeLessThan(1);
  });

  it('loses objects pushed far behind the target', () => {
    const factor = objectFogFactor({ x: 0, y: 0, z: -200 }, orbit);

    expect(factor).toBe(1);
    expect(isLostInFog(factor)).toBe(true);
  });
});
