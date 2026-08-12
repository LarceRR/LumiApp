import { describe, expect, it } from 'vitest';

import {
  MAX_ELEVATION_RAD,
  orbitScreenBasis,
  panDeltaFromScreen,
  projectPoint,
  screenGroundHit,
} from './cameraConfig';

const viewport = { width: 390, height: 844 };
const origin = { x: 0, y: 0, z: 0 };

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

describe('orbitScreenBasis', () => {
  it('agrees with the cross-product construction away from the singular pose', () => {
    const basis = orbitScreenBasis(
      { azimuth: 0.9, elevation: Math.PI / 4, distance: 8, target: origin },
      viewport,
    );
    const length = Math.hypot(-basis.forward.z, basis.forward.x);

    expect(basis.right.x).toBeCloseTo(-basis.forward.z / length, 6);
    expect(basis.right.z).toBeCloseTo(basis.forward.x / length, 6);
  });

  it('keeps screen-right tied to azimuth looking straight down', () => {
    const azimuth = Math.PI; // dragging used to invert exactly here
    const basis = orbitScreenBasis(
      { azimuth, elevation: MAX_ELEVATION_RAD, distance: 5, target: origin },
      viewport,
    );

    expect(basis.right.x).toBeCloseTo(Math.cos(azimuth), 6);
    expect(basis.right.z).toBeCloseTo(-Math.sin(azimuth), 6);
  });
});

describe('screenGroundHit', () => {
  it('lands back on the point it was projected from, top-down included', () => {
    for (const elevation of [Math.PI / 9, Math.PI / 4, MAX_ELEVATION_RAD]) {
      const orbit = { azimuth: 2.1, elevation, distance: 6, target: { x: 1, y: 0, z: -2 } };
      const basis = orbitScreenBasis(orbit, viewport);
      const world = { x: 2.5, y: 0, z: -3.5 };
      const screen = projectPoint(basis, viewport, world);
      const hit = screenGroundHit(basis, viewport, screen.x, screen.y);

      expect(hit?.x).toBeCloseTo(world.x, 4);
      expect(hit?.z).toBeCloseTo(world.z, 4);
    }
  });
});
