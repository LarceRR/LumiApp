import { describe, expect, it } from 'vitest';

import { objectYawFacingCamera, orbitAzimuthFacing } from './objectFacing';

describe('objectYawFacingCamera', () => {
  it('inverts orbitAzimuthFacing', () => {
    for (const azimuth of [-2.4, -0.7, 0, 0.35, 1.9, 3]) {
      const yaw = objectYawFacingCamera(azimuth);

      expect(Math.sin(orbitAzimuthFacing(yaw))).toBeCloseTo(Math.sin(azimuth));
      expect(Math.cos(orbitAzimuthFacing(yaw))).toBeCloseTo(Math.cos(azimuth));
    }
  });

  it('puts the default +X face a quarter turn behind the camera heading', () => {
    expect(objectYawFacingCamera(0)).toBeCloseTo(-Math.PI / 2);
  });
});
