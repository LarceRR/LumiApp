import { durations } from './durations';

export const cameraMotion = {
  fov: 45,
  defaultElevationDeg: 20,
  minElevationDeg: 20,
  maxElevationDeg: 90,
  /**
   * Straight down is a singular camera pose: the view direction lines up with
   * world up, `lookAt` loses its roll reference and screen-right stops
   * depending on azimuth. Every elevation handed to the projection stops this
   * far short of the limit — invisible on screen, and it keeps rotating,
   * dragging and tapping stable at what the user calls 90 degrees.
   */
  elevationSafetyDeg: 0.6,
  zoomSensitivity: 1.35,
  minDistanceFactor: 0.25,
  maxDistanceFactor: 3,
  /**
   * Inspect frames a model into the free zone rather than into the whole
   * screen, and top-down a model is only as tall as its footprint — both need
   * to come closer than a pinch is allowed to.
   */
  inspectMinDistanceFactor: 0.08,
  rotationGain: 1.15,
  orbitDecay: 2.8,
  orbitInertiaGain: 1,
  orbitMaxVelocity: 8,
  orbitMinVelocity: 0.02,
  panDecay: 3.2,
  panInertiaGain: 1,
  panMaxVelocity: 80,
  panMinVelocity: 0.05,
  recenterDurationMs: durations.fast,
  recenterSnapDistance: 0.04,
  fogNearFactor: 0.55,
  fogFarFactor: 1.85,
} as const;
