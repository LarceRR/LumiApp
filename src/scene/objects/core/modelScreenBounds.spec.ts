import { describe, expect, it } from 'vitest';

import { groundHitFromScreen } from './pickObjectAtScreen';
import { getModelScreenBounds, modelWorldBounds } from './modelScreenBounds';

const orbit = {
  azimuth: 0,
  elevation: 0.7,
  distance: 10,
  target: { x: 0, y: 0, z: 0 },
};
const viewport = { width: 390, height: 844 };

describe('modelWorldBounds', () => {
  it('stands the box on its base', () => {
    const bounds = modelWorldBounds({ x: 2, y: 0, z: -1 }, { halfWidth: 0.3, height: 1.2 });

    expect(bounds.min).toEqual({ x: 1.7, y: 0, z: -1.3 });
    expect(bounds.max).toEqual({ x: 2.3, y: 1.2, z: -0.7 });
    expect(bounds.center).toEqual({ x: 2, y: 0.6, z: -1 });
  });
});

describe('getModelScreenBounds', () => {
  it('projects a model at the orbit target to the middle of the screen', () => {
    const bounds = getModelScreenBounds({
      origin: { x: 0, y: 0, z: 0 },
      local: { halfWidth: 0.3, height: 1.2 },
      orbit,
      viewport,
    });

    expect(bounds).not.toBeNull();
    expect(bounds?.screen.centerX).toBeCloseTo(viewport.width / 2, 3);
    expect(bounds?.onScreen).toBe(true);
    expect(bounds?.clipped).toBe(false);
  });

  it('agrees with the inverse ray cast used for picking', () => {
    const bounds = getModelScreenBounds({
      origin: { x: 1.5, y: 0, z: -2 },
      local: { halfWidth: 0.001, height: 0 },
      orbit,
      viewport,
    });

    expect(bounds).not.toBeNull();

    const roundTrip = groundHitFromScreen(
      bounds?.screen.centerX ?? 0,
      bounds?.screen.centerY ?? 0,
      viewport.width,
      viewport.height,
      orbit,
    );

    expect(roundTrip?.x).toBeCloseTo(1.5, 3);
    expect(roundTrip?.z).toBeCloseTo(-2, 3);
  });

  it('grows on screen as the camera comes closer', () => {
    const far = getModelScreenBounds({
      origin: { x: 0, y: 0, z: 0 },
      local: { halfWidth: 0.3, height: 1.2 },
      orbit,
      viewport,
    });
    const near = getModelScreenBounds({
      origin: { x: 0, y: 0, z: 0 },
      local: { halfWidth: 0.3, height: 1.2 },
      orbit: { ...orbit, distance: 4 },
      viewport,
    });

    expect(near?.screen.height ?? 0).toBeGreaterThan(far?.screen.height ?? 0);
    expect(near?.pointsPerWorldUnit ?? 0).toBeGreaterThan(far?.pointsPerWorldUnit ?? 0);
  });

  it('refuses a zero-sized viewport instead of returning NaN', () => {
    expect(
      getModelScreenBounds({
        origin: { x: 0, y: 0, z: 0 },
        local: { halfWidth: 0.3, height: 1.2 },
        orbit,
        viewport: { width: 0, height: 0 },
      }),
    ).toBeNull();
  });
});
