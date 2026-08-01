import { FIRE_POINT_LIGHT } from './fireCoreMaterial';

/**
 * Blender Point energy used an F-curve Noise modifier (strength 200 around base 100).
 * Map that relative swing onto Three.js light intensity.
 */
export function fireLightFlickerIntensity(elapsedSeconds: number, seed = 0): number {
  const { baseIntensity, flickerMin, flickerMax } = FIRE_POINT_LIGHT;
  // Two cheap incommensurate sines ≈ soft noise without a table.
  const t = elapsedSeconds + seed * 12.9898;
  const n =
    Math.sin(t * 5.1) * 0.45 + Math.sin(t * 9.7 + 1.7) * 0.3 + Math.sin(t * 2.3 + 0.4) * 0.25;
  const normalized = 0.5 + 0.5 * n;
  const factor = flickerMin + (flickerMax - flickerMin) * normalized;
  return baseIntensity * factor;
}
