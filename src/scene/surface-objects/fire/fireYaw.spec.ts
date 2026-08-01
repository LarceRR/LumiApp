import { describe, expect, it } from 'vitest';

import { FIRE_YAW_LIMIT_RAD, fireYawRadians, hashUnit } from './fireYaw';

describe('fireYaw', () => {
  it('is stable for the same id', () => {
    expect(fireYawRadians('sob_1')).toBe(fireYawRadians('sob_1'));
  });

  it('stays within ±limit', () => {
    for (const id of ['a', 'b', 'fire-3', 'очень-длинный-id']) {
      const yaw = fireYawRadians(id);
      expect(Math.abs(yaw)).toBeLessThanOrEqual(FIRE_YAW_LIMIT_RAD);
    }
  });

  it('hashUnit stays in [0, 1)', () => {
    expect(hashUnit('x')).toBeGreaterThanOrEqual(0);
    expect(hashUnit('x')).toBeLessThan(1);
  });
});
