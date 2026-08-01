import { describe, expect, it } from 'vitest';

import { FireParticleLayer } from './fireParticleLayer';
import { DEFAULT_FIRE_SETTINGS } from './fireSettings';

const wind = DEFAULT_FIRE_SETTINGS.wind;
const layerConfig = DEFAULT_FIRE_SETTINGS.flame;

function positions(layer: FireParticleLayer): { x: number; y: number; z: number }[] {
  const result: { x: number; y: number; z: number }[] = [];
  layer.forEach((x, y, z) => {
    result.push({ x, y, z });
  });
  return result;
}

describe('FireParticleLayer', () => {
  it('fills up to its budget and never past it', () => {
    const layer = new FireParticleLayer(layerConfig, 12);
    layer.update(0.016, wind);

    expect(layer.count).toBe(12);

    layer.configure(layerConfig, 4);
    layer.update(0.016, wind);

    expect(layer.count).toBe(4);
  });

  it('holds perfectly still at delta 0, so a frozen fire keeps its shape', () => {
    const layer = new FireParticleLayer(layerConfig, 8);
    layer.update(0.016, wind);
    const before = positions(layer);

    layer.update(0, wind);

    expect(positions(layer)).toEqual(before);
  });

  it('rises over time', () => {
    const layer = new FireParticleLayer({ ...layerConfig, spread: 0 }, 6);
    layer.update(0.016, wind);
    const before = positions(layer).map((item) => item.y);

    layer.update(0.2, wind);
    const after = positions(layer).map((item) => item.y);

    expect(after.some((y, index) => y > (before[index] ?? 0))).toBe(true);
  });

  it('pushes particles downwind', () => {
    const layer = new FireParticleLayer({ ...layerConfig, spread: 0 }, 6);
    layer.update(0.5, wind);
    layer.update(0.5, { strength: 3, direction: 0, minHeight: -5, maxHeight: 1 });

    expect(positions(layer).some((item) => item.x > 0)).toBe(true);
  });

  it('keeps every scale inside the authored range', () => {
    const layer = new FireParticleLayer(layerConfig, 20);
    layer.update(0.3, wind);

    const low = Math.min(layerConfig.scaleFrom.min, layerConfig.scaleTo.min);
    const high = Math.max(layerConfig.scaleFrom.max, layerConfig.scaleTo.max);

    layer.forEach((_x, _y, _z, scale) => {
      expect(scale).toBeGreaterThanOrEqual(low);
      expect(scale).toBeLessThanOrEqual(high);
    });
  });
});
