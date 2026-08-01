import { describe, expect, it } from 'vitest';

import { FIRE_LOCAL_FACE_NORMAL, orbitAzimuthFacing } from './fireFacing';

describe('orbitAzimuthFacing', () => {
  it('puts the camera on +X when yaw is 0 (fire sheet faces +X)', () => {
    // orbitPosition: camera offset = (sin(az), cos(az)) → az = π/2 → (+1, 0)
    expect(orbitAzimuthFacing(0, FIRE_LOCAL_FACE_NORMAL)).toBeCloseTo(Math.PI / 2);
  });

  it('rotates the camera with the object yaw', () => {
    const yaw = 0.3;
    const az = orbitAzimuthFacing(yaw, FIRE_LOCAL_FACE_NORMAL);
    expect(Math.sin(az)).toBeCloseTo(Math.cos(yaw));
    expect(Math.cos(az)).toBeCloseTo(-Math.sin(yaw));
  });

  it('uses -Z face when told to (legacy character convention)', () => {
    const az0 = orbitAzimuthFacing(0, { x: 0, z: -1 });
    expect(Math.sin(az0)).toBeCloseTo(0);
    expect(Math.cos(az0)).toBeCloseTo(-1);

    const yaw = 0.2;
    const az = orbitAzimuthFacing(yaw, { x: 0, z: -1 });
    expect(Math.sin(az)).toBeCloseTo(-Math.sin(yaw));
    expect(Math.cos(az)).toBeCloseTo(-Math.cos(yaw));
  });
});
