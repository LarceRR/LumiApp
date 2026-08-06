import { describe, expect, it } from 'vitest';

import {
  BLOOM_MIPS,
  BLOOM_SOFT_KNEE,
  bloomMipWeights,
  brightPassContribution,
} from './bloomTuning';

const sum = (values: readonly number[]): number => values.reduce((total, v) => total + v, 0);

describe('bloomMipWeights', () => {
  it('always sums to one, whatever the tier picked', () => {
    for (const mips of Object.values(BLOOM_MIPS)) {
      const weights = bloomMipWeights(0.6, mips);

      expect(weights).toHaveLength(mips);
      expect(sum(weights)).toBeCloseTo(1, 6);
    }
  });

  it('moves energy from the tight mips to the wide ones as radius grows', () => {
    const tight = bloomMipWeights(0, 5);
    const wide = bloomMipWeights(1, 5);

    expect(tight[0]).toBeGreaterThan(wide[0] ?? 0);
    expect(wide[4]).toBeGreaterThan(tight[4] ?? 0);
  });

  it('clamps the radius and the mip count instead of producing junk', () => {
    expect(bloomMipWeights(-3, 99)).toHaveLength(5);
    expect(sum(bloomMipWeights(42, 0))).toBeCloseTo(1, 6);
  });
});

describe('brightPassContribution', () => {
  const threshold = 1.2;

  it('ignores everything below the knee, so the surface never blooms', () => {
    const kneeStart = threshold - threshold * BLOOM_SOFT_KNEE;

    expect(brightPassContribution(0, threshold)).toBe(0);
    expect(brightPassContribution(kneeStart, threshold)).toBeCloseTo(0, 4);
    expect(brightPassContribution(0.95, threshold)).toBe(0);
  });

  it('fades in over the knee instead of popping on at the threshold', () => {
    const atThreshold = brightPassContribution(threshold, threshold);

    expect(atThreshold).toBeGreaterThan(0);
    expect(atThreshold).toBeLessThan(0.2);
  });

  it('passes the overbright part through once well past the threshold', () => {
    expect(brightPassContribution(5, threshold)).toBeCloseTo(5 - threshold, 6);
  });

  it('never decreases as the pixel gets brighter', () => {
    let previous = -1;

    for (let luma = 0; luma <= 6; luma += 0.05) {
      const value = brightPassContribution(luma, threshold);

      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
});
