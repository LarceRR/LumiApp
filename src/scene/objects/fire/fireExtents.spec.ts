import { describe, expect, it } from 'vitest';

import { fireVisualCoreExtents } from './fireExtents';
import { DEFAULT_FIRE_SETTINGS } from './fireSettings';

const { flame, ember, worldScale } = DEFAULT_FIRE_SETTINGS;

describe('fireVisualCoreExtents', () => {
  it('measures the flame body, not the tallest possible particle', () => {
    const extents = fireVisualCoreExtents(DEFAULT_FIRE_SETTINGS);

    expect(extents.height).toBeLessThan(flame.speedMax * flame.lifeTime * worldScale);
    expect(extents.height).toBeGreaterThan(
      flame.speedMin * flame.lifeTime * 0.6 * worldScale,
    );
  });

  it('ignores embers, which fly far above the flame', () => {
    const extents = fireVisualCoreExtents(DEFAULT_FIRE_SETTINGS);

    expect(extents.height).toBeLessThan(ember.speedMin * ember.lifeTime * worldScale);
  });

  it('is wider than the spawn box and narrower than the cell', () => {
    const extents = fireVisualCoreExtents(DEFAULT_FIRE_SETTINGS);

    expect(extents.halfWidth).toBeGreaterThan((flame.spread / 2) * worldScale);
    expect(extents.halfWidth).toBeLessThan(0.5);
  });

  it('scales with worldScale', () => {
    const single = fireVisualCoreExtents(DEFAULT_FIRE_SETTINGS);
    const doubled = fireVisualCoreExtents({
      ...DEFAULT_FIRE_SETTINGS,
      worldScale: worldScale * 2,
    });

    expect(doubled.height).toBeCloseTo(single.height * 2);
    expect(doubled.halfWidth).toBeCloseTo(single.halfWidth * 2);
  });
});
