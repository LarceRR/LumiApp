import { Easing } from 'react-native-reanimated';

/** Cubic bezier control points, shared between Reanimated and react-spring. */
export const easingCurves = {
  standard: [0.2, 0, 0, 1],
  decelerate: [0.05, 0.7, 0.1, 1],
  accelerate: [0.3, 0, 1, 1],
  emphasized: [0.2, 0, 0, 1],
  gentle: [0.4, 0, 0.2, 1],
} as const satisfies Readonly<Record<string, readonly [number, number, number, number]>>;

export type EasingName = keyof typeof easingCurves;

export function reanimatedEasing(name: EasingName): ReturnType<typeof Easing.bezier> {
  const [x1, y1, x2, y2] = easingCurves[name];

  return Easing.bezier(x1, y1, x2, y2);
}

/** Spring presets for Reanimated (UI). */
export const springs = {
  ui: { mass: 1, tension: 220, friction: 26 },
} as const;
