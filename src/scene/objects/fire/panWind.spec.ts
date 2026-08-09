import { describe, expect, it } from 'vitest';

import { DEFAULT_FIRE_SETTINGS } from './fireSettings';
import { dampPanGust, PAN_WIND, panGustVector, panWindSettings, ZERO_GUST } from './panWind';

const base = DEFAULT_FIRE_SETTINGS.wind;

describe('panGustVector', () => {
  it('stays silent while the camera is still', () => {
    expect(panGustVector(0, 0, 1 / 60)).toEqual(ZERO_GUST);
  });

  it('blows against the direction of travel', () => {
    const gust = panGustVector(1, 0, 1 / 60);

    expect(gust.x).toBeLessThan(0);
    expect(gust.z).toBeCloseTo(0, 6);
  });

  it('never exceeds the strength cap, however fast the pan', () => {
    const gust = panGustVector(500, 500, 1 / 60);

    expect(Math.hypot(gust.x, gust.z)).toBeLessThanOrEqual(PAN_WIND.maxStrength + 1e-6);
  });

  it('ignores a zero-length frame instead of dividing by it', () => {
    expect(panGustVector(1, 1, 0)).toEqual(ZERO_GUST);
  });
});

describe('dampPanGust', () => {
  it('rises faster than it falls', () => {
    const target = { x: 1, z: 0 };
    const rise = dampPanGust(ZERO_GUST, target, 0.1);
    const fall = dampPanGust(target, ZERO_GUST, 0.1);

    expect(rise.x).toBeGreaterThan(target.x - fall.x);
  });

  it('converges on the target', () => {
    let gust = ZERO_GUST;

    for (let frame = 0; frame < 120; frame += 1) {
      gust = dampPanGust(gust, { x: 0.8, z: -0.2 }, 1 / 60);
    }

    expect(gust.x).toBeCloseTo(0.8, 2);
    expect(gust.z).toBeCloseTo(-0.2, 2);
  });
});

describe('panWindSettings', () => {
  it('returns the authored wind untouched when there is no gust', () => {
    expect(panWindSettings(ZERO_GUST, base)).toEqual(base);
  });

  it('turns a gust into a positive strength and a normalised heading', () => {
    const wind = panWindSettings({ x: -1, z: 0 }, base);

    expect(wind.strength).toBeCloseTo(1, 6);
    expect(wind.direction).toBeGreaterThanOrEqual(0);
    expect(wind.direction).toBeLessThan(360);
    expect(wind.direction).toBeCloseTo(180, 6);
  });

  it('sums the authored wind and the gust as vectors', () => {
    const authored = { strength: 1, direction: 0, minHeight: 0, maxHeight: 2.5 };
    const wind = panWindSettings({ x: 1, z: 0 }, authored);

    expect(wind.strength).toBeCloseTo(2, 6);
    expect(wind.direction).toBeCloseTo(0, 6);
  });
});
