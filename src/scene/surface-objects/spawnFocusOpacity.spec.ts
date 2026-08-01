import { describe, expect, it } from 'vitest';

import { dampOverMs } from '@/shared/utils/math';

import {
  fireAnimationPlaying,
  fireFocusLostByZoom,
  spawnFocusOpacityTarget,
} from './spawnFocusOpacity';

describe('spawnFocusOpacityTarget', () => {
  it('dims non-focus fires while another fire is focused', () => {
    expect(spawnFocusOpacityTarget(false, true)).toBeLessThan(0.2);
    expect(spawnFocusOpacityTarget(true, true)).toBe(1);
    expect(spawnFocusOpacityTarget(false, false)).toBe(1);
  });
});

describe('fireAnimationPlaying', () => {
  const base = {
    isSpawning: false,
    spawnElapsedMs: 10_000,
    isSelected: false,
    focusTourActive: false,
    cameraDistance: 10,
    focusDistance: 5.5,
  };

  it('plays during the spawn window even after spawningId clears', () => {
    expect(fireAnimationPlaying({ ...base, spawnElapsedMs: 500 })).toBe(true);
    expect(fireAnimationPlaying({ ...base, spawnElapsedMs: 2_900 })).toBe(true);
    expect(fireAnimationPlaying({ ...base, spawnElapsedMs: 3_100 })).toBe(false);
  });

  it('plays infinitely while selected and near focus distance', () => {
    expect(
      fireAnimationPlaying({
        ...base,
        isSelected: true,
        cameraDistance: 5.5,
      }),
    ).toBe(true);
    expect(
      fireAnimationPlaying({
        ...base,
        isSelected: true,
        focusTourActive: true,
        cameraDistance: 8,
      }),
    ).toBe(true);
  });

  it('stops when selected but zoomed away', () => {
    expect(
      fireAnimationPlaying({
        ...base,
        isSelected: true,
        cameraDistance: 5.5 * 1.3,
      }),
    ).toBe(false);
  });
});

describe('fireFocusLostByZoom', () => {
  it('clears only after the tour ends and distance exceeds the leave factor', () => {
    expect(fireFocusLostByZoom(true, true, 20, 5.5)).toBe(false);
    expect(fireFocusLostByZoom(true, false, 5.5, 5.5)).toBe(false);
    expect(fireFocusLostByZoom(true, false, 5.5 * 1.3, 5.5)).toBe(true);
    expect(fireFocusLostByZoom(false, false, 20, 5.5)).toBe(false);
  });
});

describe('dampOverMs', () => {
  it('approaches the target smoothly instead of snapping', () => {
    let value = 1;
    const target = 0.1;

    for (let step = 0; step < 6; step += 1) {
      value = dampOverMs(value, target, 320, 1 / 60);
    }

    expect(value).toBeLessThan(1);
    expect(value).toBeGreaterThan(target);
  });

  it('settles near the target within the fade window', () => {
    let value = 1;
    const target = 0.1;
    const fadeMs = 320;
    const steps = Math.ceil((fadeMs / 1000) * 60);

    for (let step = 0; step < steps; step += 1) {
      value = dampOverMs(value, target, fadeMs, 1 / 60);
    }

    expect(value).toBeCloseTo(target, 1);
  });
});
