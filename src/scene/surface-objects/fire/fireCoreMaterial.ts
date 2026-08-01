import { Color, MeshBasicMaterial } from 'three';

import { getActiveFirePreset } from './fireConfig';

/**
 * Blender `lambert1` core (no maps): warm emissive look, unlit.
 * MeshBasicMaterial — no specular / scene-light response (Glow is pure Emission).
 */
const CORE_EMISSIVE_LINEAR = { r: 1, g: 0.401419, b: 0.01523 } as const;
export const FIRE_CORE_EMISSION_STRENGTH = 3.3;

function linearColor(rgb: { readonly r: number; readonly g: number; readonly b: number }): Color {
  return new Color().setRGB(rgb.r, rgb.g, rgb.b, 'srgb-linear');
}

/** Opaque unlit core — cartoon self-lit sphere. */
export function createFlameCoreMaterial(): MeshBasicMaterial {
  const preset = getActiveFirePreset();
  const color = linearColor(CORE_EMISSIVE_LINEAR).multiplyScalar(
    preset.materials.coreEmissionStrength,
  );

  return new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 1,
    depthWrite: true,
    toneMapped: true,
    fog: true,
  });
}

/** Soft unlit inner glow under the core. */
export function createFlameInnerGlowMaterial(): MeshBasicMaterial {
  const color = linearColor(CORE_EMISSIVE_LINEAR);

  return new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    toneMapped: true,
    fog: true,
  });
}

/** Defaults tuned for UnrealBloomPass when a composer is wired in. */
export const FIRE_BLOOM_DEFAULTS = {
  strength: 0.55,
  radius: 0.35,
  threshold: 0.82,
} as const;

/** Point-light colour from active preset. */
export function firePointLightColor(): Color {
  return getActiveFirePreset().light.color.clone();
}

export const FIRE_POINT_LIGHT = {
  /** Lights the surface around the fire, not the fire meshes (those are unlit). */
  baseIntensity: 2.4,
  flickerMin: 0.4,
  flickerMax: 1.6,
  distance: 12,
  decay: 2,
} as const;
