import { describe, expect, it } from 'vitest';

import { panDeltaFromScreen } from './cameraConfig';

describe('panDeltaFromScreen', () => {
  it('keeps the map moving with the finger at default azimuth and elevation', () => {
    const scale = 0.01;
    const halfPiElevation = Math.PI / 2; // sin = 1

    // Finger right → look-at left → fixed map centre drifts right on screen.
    expect(panDeltaFromScreen(10, 0, 0, halfPiElevation, scale).x).toBeCloseTo(-0.1);
    expect(panDeltaFromScreen(-10, 0, 0, halfPiElevation, scale).x).toBeCloseTo(0.1);
    expect(panDeltaFromScreen(0, 10, 0, halfPiElevation, scale).z).toBeCloseTo(-0.1);
  });

  it('scales vertical pan delta according to camera elevation angle', () => {
    const scale = 0.01;
    const elev30Deg = Math.PI / 6; // sin(30°) = 0.5 -> 1/sin = 2

    const delta = panDeltaFromScreen(0, 10, 0, elev30Deg, scale);
    expect(delta.z).toBeCloseTo(-0.2);
  });
});
