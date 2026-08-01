export const durations = {
  instant: 0,
  micro: 120,
  fast: 200,
  base: 320,
  slow: 520,
  deliberate: 700,
  ambient: 1_400,
  breath: 2_600,
} as const;

export const delays = {
  none: 0,
  short: 80,
  medium: 180,
  long: 360,
  /** Beat of silence before a new object materialises. */
  spawnPause: 420,
} as const;

export const stagger = {
  none: 0,
  tight: 40,
  loose: 90,
} as const;
