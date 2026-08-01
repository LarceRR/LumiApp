import { durations } from './durations';

export const cameraMotion = {
  /** Field of view in degrees. */
  fov: 45,
  /** Default elevation above the surface plane in degrees. */
  defaultElevationDeg: 20,
  minElevationDeg: 10,
  maxElevationDeg: 55,
  /** Radians applied per radian of two-finger twist. */
  rotationGain: 1.15,
  /** Elevation change while shifting the pinch focal point (rad / px). */
  pinchElevationSensitivity: 0.004,
  /**
   * Pinch → distance. Scale of 2 (fingers twice as far) maps to this
   * multiplicative distance change when sensitivity = 1.
   */
  zoomSensitivity: 1.35,
  /** Distance limits relative to the default framing distance. */
  minDistanceFactor: 0.25,
  maxDistanceFactor: 2,
  /** Exponential decay for residual orbit spin (per second). */
  orbitDecay: 2.8,
  orbitInertiaGain: 1,
  orbitMaxVelocity: 8,
  orbitMinVelocity: 0.02,
  /** Exponential decay for residual pan glide (per second). */
  panDecay: 3.2,
  panInertiaGain: 1,
  panMaxVelocity: 80,
  panMinVelocity: 0.05,
  /** Double-tap recenter animation length. */
  recenterDurationMs: durations.fast,
  /** Skip recenter when already this close to map centre (world units). */
  recenterSnapDistance: 0.04,
  /** Fog distance as multiples of current camera distance. */
  fogNearFactor: 0.55,
  fogFarFactor: 1.85,
} as const;
