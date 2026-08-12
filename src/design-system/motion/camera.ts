import { durations } from './durations';

export const cameraMotion = {
  fov: 45,
  defaultElevationDeg: 20,
  minElevationDeg: 20,
  maxElevationDeg: 90,
  zoomSensitivity: 1.35,
  minDistanceFactor: 0.25,
  maxDistanceFactor: 3,
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
