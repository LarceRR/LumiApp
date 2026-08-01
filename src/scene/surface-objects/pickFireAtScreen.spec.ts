import { describe, expect, it } from 'vitest';

import type { SurfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';

import { groundHitFromScreen, pickNearestFire } from './pickFireAtScreen';

const id = (value: string): SurfaceObjectId => value as SurfaceObjectId;

describe('pickNearestFire', () => {
  it('picks the closest cell within range', () => {
    const hit = { x: 0.1, z: -0.1 };
    const picked = pickNearestFire(hit, [
      { id: id('a'), cell: { x: 0, y: 0 } },
      { id: id('b'), cell: { x: 3, y: 0 } },
    ]);
    expect(picked?.id).toBe('a');
  });

  it('returns null when nothing is near', () => {
    expect(pickNearestFire({ x: 50, z: 50 }, [{ id: id('a'), cell: { x: 0, y: 0 } }])).toBeNull();
  });
});

describe('groundHitFromScreen', () => {
  it('hits near the orbit target when tapping the screen centre', () => {
    const hit = groundHitFromScreen(200, 400, 400, 800, {
      azimuth: 0,
      elevation: Math.PI / 4,
      distance: 12,
      target: { x: 2, y: 0, z: -3 },
    });
    expect(hit).not.toBeNull();
    if (hit === null) {
      return;
    }
    expect(hit.x).toBeCloseTo(2, 0);
    expect(hit.z).toBeCloseTo(-3, 0);
  });
});
