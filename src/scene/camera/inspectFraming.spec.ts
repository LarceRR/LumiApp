import { describe, expect, it } from 'vitest';

import { cameraMotion } from '@/design-system/motion/camera';
import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import { screenBoxBoundsForOrbit } from '@/scene/objects/core/screenBoxBounds';
import { fireVisualCoreExtents } from '@/scene/objects/fire/fireExtents';
import { DEFAULT_FIRE_SETTINGS } from '@/scene/objects/fire/fireSettings';

import {
  defaultCameraDistance,
  defaultVisibleRows,
  MAX_ELEVATION_RAD,
  RENDER_MAX_ELEVATION_RAD,
} from './cameraConfig';
import { resolveFreeZone } from './freeZone';
import { solveInspectFraming } from './inspectFraming';

const viewport = { width: 390, height: 844 };
const world = { x: 3, y: 0, z: -2 };
const extents = fireVisualCoreExtents(DEFAULT_FIRE_SETTINGS);
const freeZone = resolveFreeZone({
  viewportWidth: viewport.width,
  viewportHeight: viewport.height,
  safeAreaTop: 47,
});
const defaultDistance = defaultCameraDistance(viewport.height, defaultVisibleRows(viewport.height));
const azimuth = 0.7;

function frame(elevation: number) {
  return solveInspectFraming({
    world,
    extents,
    viewport,
    azimuth,
    elevation,
    freeZone,
    startDistance: defaultDistance * surfaceObjectMotion.inspect.distanceFactor,
    minDistance: defaultDistance * cameraMotion.inspectMinDistanceFactor,
    maxDistance: defaultDistance * cameraMotion.maxDistanceFactor,
  });
}

const elevations = [Math.PI / 9, Math.PI / 4, MAX_ELEVATION_RAD];

describe('solveInspectFraming', () => {
  it('fills the requested share of the free zone at any angle', () => {
    for (const elevation of elevations) {
      const framing = frame(elevation);

      expect(framing.clamped).toBe(false);
      expect(framing.fill).toBeCloseTo(surfaceObjectMotion.inspect.fitFraction, 2);
    }
  });

  it('puts the model box centre on the free zone centre', () => {
    for (const elevation of elevations) {
      const framing = frame(elevation);
      const box = screenBoxBoundsForOrbit(world, extents, viewport, {
        azimuth,
        elevation: framing.elevation,
        distance: framing.distance,
        target: framing.target,
      });

      expect(box?.rect.centerY).toBeCloseTo(freeZone.centerY, 0);
      expect(box?.rect.centerX).toBeCloseTo(freeZone.centerX, 0);
    }
  });

  it('keeps the angle it was given instead of tilting back', () => {
    expect(frame(MAX_ELEVATION_RAD).elevation).toBe(MAX_ELEVATION_RAD);
    expect(RENDER_MAX_ELEVATION_RAD).toBeLessThan(MAX_ELEVATION_RAD);
  });

  it('lifts the target above the ground plane at a low angle', () => {
    // Raising a model into the upper band means looking below the surface.
    expect(frame(Math.PI / 9).target.y).toBeLessThan(0);
  });

  it('reports a clamp instead of diving through the model', () => {
    const framing = solveInspectFraming({
      world,
      extents,
      viewport,
      azimuth,
      elevation: Math.PI / 9,
      freeZone,
      startDistance: defaultDistance,
      minDistance: defaultDistance,
      maxDistance: defaultDistance * 3,
    });

    expect(framing.clamped).toBe(true);
    expect(framing.fill).toBeLessThan(surfaceObjectMotion.inspect.fitFraction);
  });
});
