/**
 * Every knob of the voxel fire, in one plain object.
 *
 * Values are authored in emitter-local units (base of the fire at y = 0) and
 * multiplied by `worldScale` when written into the scene, so one fire fits a
 * single surface cell regardless of how the particle numbers are tuned.
 */
export type FireScaleRange = {
  readonly min: number;
  readonly max: number;
};

export type FireLayerSettings = {
  readonly lifeTime: number;
  readonly speedMin: number;
  readonly speedMax: number;
  readonly maxParticles: number;
  /** Pulse layers swell to `scaleTo` mid-life; the rest lerp from → to. */
  readonly pulse: boolean;
  readonly scaleFrom: FireScaleRange;
  readonly scaleTo: FireScaleRange;
  /** Horizontal spawn box, emitter-local units. */
  readonly spread: number;
  /** Emission multiplier — how hard the layer burns into the bloom. */
  readonly multiply: number;
  /** Height over which the colour ramp travels from bright to dim. */
  readonly rangeY: number;
  readonly dimColor: string;
  readonly brightColor: string;
};

export type FireWindSettings = {
  readonly strength: number;
  /** Degrees on the XZ plane. */
  readonly direction: number;
  readonly minHeight: number;
  readonly maxHeight: number;
};

export type FireBloomSettings = {
  readonly strength: number;
  readonly radius: number;
  readonly threshold: number;
};

export type FireSettings = {
  /** Simulation time multiplier. 0 freezes the fire without unmounting it. */
  readonly globalSpeed: number;
  /** Emitter-local units → world units. One cell is 1 world unit. */
  readonly worldScale: number;
  /** Soft fade-in at the very base, so the fire does not cut off on the grid. */
  readonly bottomRound: number;
  /** Particle budget for fires that are not the current focus. */
  readonly idleParticleFactor: number;
  readonly ember: FireLayerSettings;
  readonly flame: FireLayerSettings;
  readonly wind: FireWindSettings;
  readonly bloom: FireBloomSettings;
};

export const DEFAULT_FIRE_SETTINGS: FireSettings = {
  globalSpeed: 1,
  worldScale: 0.3,
  bottomRound: 0.12,
  idleParticleFactor: 0.35,
  ember: {
    lifeTime: 2,
    speedMin: 1.8,
    speedMax: 4,
    maxParticles: 90,
    pulse: false,
    scaleFrom: { min: 0.008, max: 0.045 },
    scaleTo: { min: 0.005, max: 0.03 },
    spread: 1,
    multiply: 6.5,
    rangeY: 3.2,
    dimColor: '#6f2b0a',
    brightColor: '#ffaa44',
  },
  flame: {
    lifeTime: 1.4,
    speedMin: 0.7,
    speedMax: 1.5,
    maxParticles: 16,
    pulse: true,
    scaleFrom: { min: 0.06, max: 0.14 },
    scaleTo: { min: 0.22, max: 0.45 },
    spread: 0.6,
    multiply: 1.6,
    rangeY: 1.1,
    dimColor: '#de6524',
    brightColor: '#fff4d6',
  },
  wind: {
    strength: 0,
    direction: 0,
    minHeight: 0,
    maxHeight: 2.5,
  },
  bloom: {
    strength: 0.55,
    radius: 0.35,
    threshold: 0.82,
  },
};

/** Defaults for an UnrealBloomPass wired over the scene. */
export const FIRE_BLOOM_DEFAULTS = DEFAULT_FIRE_SETTINGS.bloom;

/** Particles one fire may use, given whether it currently holds focus. */
export function fireParticleBudget(
  layer: FireLayerSettings,
  settings: FireSettings,
  isFocused: boolean,
): number {
  const factor = isFocused ? 1 : settings.idleParticleFactor;

  return Math.max(1, Math.round(layer.maxParticles * factor));
}
