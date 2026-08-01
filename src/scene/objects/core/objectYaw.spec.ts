import { describe, expect, it } from 'vitest';

import { OBJECT_YAW_LIMIT_RAD, objectYawRadians } from './objectYaw';

describe('objectYawRadians', () => {
  it('is deterministic for the same id', () => {
    expect(objectYawRadians('obj-1')).toBe(objectYawRadians('obj-1'));
  });

  it('stays inside the authored limit', () => {
    for (const id of ['a', 'b', 'obj-42', 'long-identifier-value']) {
      expect(Math.abs(objectYawRadians(id))).toBeLessThanOrEqual(OBJECT_YAW_LIMIT_RAD);
    }
  });

  it('separates different ids', () => {
    expect(objectYawRadians('a')).not.toBe(objectYawRadians('b'));
  });
});
