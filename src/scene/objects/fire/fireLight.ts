export const FIRE_LIGHT = {
  /** Lights the surface around the fire — the particles themselves are unlit. */
  baseIntensity: 2.4,
  flickerMin: 0.4,
  flickerMax: 1.6,
  distance: 8,
  decay: 2,
} as const;

/** Two cheap incommensurate sines ≈ soft flicker noise without a table. */
export function fireLightIntensity(elapsedSeconds: number, seed = 0): number {
  const t = elapsedSeconds + seed * 12.9898;
  const noise =
    Math.sin(t * 5.1) * 0.45 + Math.sin(t * 9.7 + 1.7) * 0.3 + Math.sin(t * 2.3 + 0.4) * 0.25;
  const normalized = 0.5 + 0.5 * noise;
  const factor =
    FIRE_LIGHT.flickerMin + (FIRE_LIGHT.flickerMax - FIRE_LIGHT.flickerMin) * normalized;

  return FIRE_LIGHT.baseIntensity * factor;
}
