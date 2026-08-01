import { describe, expect, it } from 'vitest';

import {
  type FocusTourState,
  focusTourFrame,
  focusTourObjectPose,
  focusTourPhase,
  focusTourRevealStart,
  focusTourTotalSeconds,
  lerpAngle,
} from './focusTour';

const base: FocusTourState = {
  focusTarget: { x: 4, y: 0, z: 2 },
  savedTarget: { x: 0, y: 0, z: 0 },
  savedDistance: 10,
  savedAzimuth: 0,
  focusDistance: 5,
  faceYaw: 0.2,
  // Camera on the fire's +X face after yaw (see orbitAzimuthFacing).
  focusAzimuth: 0.2 + Math.PI / 2,
  elapsedSeconds: 0,
  approachSeconds: 0.6,
  revealSeconds: 1.2,
  overlapSeconds: 0.19,
  launchSeconds: 0.38,
  fallSeconds: 0.82,
  spinTurns: 2,
};

describe('focusTour', () => {
  it('approaches then holds through reveal (no return)', () => {
    expect(focusTourPhase({ ...base, elapsedSeconds: 0.3 })).toBe('approach');
    expect(focusTourPhase({ ...base, elapsedSeconds: 0.7 })).toBe('reveal');
    expect(focusTourTotalSeconds(base)).toBeCloseTo(
      base.approachSeconds + (base.revealSeconds - base.overlapSeconds),
    );
  });

  it('keeps camera azimuth fixed while the object spins', () => {
    const midReveal = focusTourFrame({
      ...base,
      elapsedSeconds: base.approachSeconds + 0.2,
    });
    expect(midReveal.azimuth).toBe(base.focusAzimuth);
    expect(midReveal.done).toBe(false);

    const pose = focusTourObjectPose({
      ...base,
      elapsedSeconds: base.approachSeconds + 0.2,
    });
    expect(pose.spinRadians).toBeGreaterThan(0);
  });

  it('stays grounded until the camera is nearly there, then launches and settles', () => {
    const grounded = focusTourObjectPose({ ...base, elapsedSeconds: 0.2 });
    expect(grounded.heightFactor).toBe(0);

    const revealStart = focusTourRevealStart(base);
    const launching = focusTourObjectPose({
      ...base,
      elapsedSeconds: revealStart + base.launchSeconds * 0.25,
    });
    expect(launching.heightFactor).toBeGreaterThan(0);
    expect(revealStart + base.launchSeconds * 0.25).toBeLessThan(base.approachSeconds);

    const settled = focusTourObjectPose({
      ...base,
      elapsedSeconds: revealStart + base.revealSeconds,
    });
    expect(settled.heightFactor).toBeCloseTo(0);
    expect(settled.spinRadians).toBeCloseTo(base.spinTurns * Math.PI * 2);
  });

  it('settles the camera on the focus framing when done', () => {
    const frame = focusTourFrame({
      ...base,
      elapsedSeconds: focusTourTotalSeconds(base),
    });
    expect(frame.done).toBe(true);
    expect(frame.target).toEqual(base.focusTarget);
    expect(frame.azimuth).toBe(base.focusAzimuth);
  });

  it('lerps azimuth along the short arc', () => {
    expect(lerpAngle(0, Math.PI / 2, 0.5)).toBeCloseTo(Math.PI / 4);
  });
});
