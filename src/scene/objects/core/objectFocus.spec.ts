import { describe, expect, it } from 'vitest';

import { focusLostByZoom, objectAnimationPlaying, objectOpacityTarget } from './objectFocus';

describe('objectAnimationPlaying', () => {
  it('animates a visible object', () => {
    expect(objectAnimationPlaying({ fogFactor: 0.2, reduceMotion: false })).toBe(true);
  });

  it('stops once the object has left the fog volume', () => {
    expect(objectAnimationPlaying({ fogFactor: 1, reduceMotion: false })).toBe(false);
  });

  it('respects the reduced-motion preference', () => {
    expect(objectAnimationPlaying({ fogFactor: 0, reduceMotion: true })).toBe(false);
  });
});

describe('objectOpacityTarget', () => {
  it('keeps the focused object bright and dims the rest', () => {
    expect(objectOpacityTarget(true, true)).toBe(1);
    expect(objectOpacityTarget(false, true)).toBeLessThan(1);
    expect(objectOpacityTarget(false, false)).toBe(1);
  });
});

describe('focusLostByZoom', () => {
  it('ignores unselected objects and running tours', () => {
    expect(focusLostByZoom(false, false, 100, 5)).toBe(false);
    expect(focusLostByZoom(true, true, 100, 5)).toBe(false);
  });

  it('drops focus once the camera pulls far enough back', () => {
    expect(focusLostByZoom(true, false, 5, 5)).toBe(false);
    expect(focusLostByZoom(true, false, 50, 5)).toBe(true);
  });
});
