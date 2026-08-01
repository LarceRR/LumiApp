import { Color } from 'three';

import fireEmojiModel from '@/assets/models/FireEmoji.glb';

/** Metro resolves `.glb` imports to asset module IDs at runtime. */
export const DEFAULT_FIRE_MODEL_ASSET = fireEmojiModel as unknown as string;

export type FireMaterialConfig = {
  /** Color ramp stops from base to tip (linear RGB). */
  readonly rampStops: readonly { pos: number; color: Color }[];
  /** Emission strength multiplier for the Glow shell shader. */
  readonly emissionStrength: number;
  /** Fresnel blend factor. */
  readonly fresnelBlend: number;
  /** Mask blend factor. */
  readonly maskBlend: number;
  /** Core emission color multiplier. */
  readonly coreEmissionStrength: number;
};

export type FireAnimationConfig = {
  /** Displace 1 strength (Marble noise). */
  readonly displace1: number;
  /** Displace 2 strength (Clouds noise). */
  readonly displace2: number;
  /** Vertical noise scroll speed. */
  readonly noiseScroll: number;
  /** Magic texture scale. */
  readonly magicScale: number;
  /** Magic texture distortion. */
  readonly magicDistortion: number;
};

export type FireLightConfig = {
  readonly enabled: boolean;
  readonly color: Color;
  readonly baseIntensity: number;
  readonly flickerMin: number;
  readonly flickerMax: number;
  readonly distance: number;
  readonly decay: number;
};

export type FirePreset = {
  readonly id: string;
  readonly name: string;
  readonly modelAsset: string;
  readonly shellMeshZOffset: number;
  readonly materials: FireMaterialConfig;
  readonly animation: FireAnimationConfig;
  readonly light: FireLightConfig;
};

/** Default "Emoji Fire" preset (Blender Angry Fire parity). */
export const EMOJI_FIRE_PRESET: FirePreset = {
  id: 'emoji',
  name: 'Angry Fire Emoji',
  modelAsset: DEFAULT_FIRE_MODEL_ASSET,
  shellMeshZOffset: -0.5,
  materials: {
    rampStops: [
      { pos: 0, color: new Color().setRGB(0, 0, 0, 'srgb-linear') },
      { pos: 0.127273, color: new Color().setRGB(1, 0.036699, 0.019042, 'srgb-linear') },
      { pos: 0.55, color: new Color().setRGB(1, 0.1, 0, 'srgb-linear') },
      { pos: 1, color: new Color().setRGB(1, 0.829966, 0.029856, 'srgb-linear') },
    ],
    emissionStrength: 5,
    fresnelBlend: 0.2,
    maskBlend: 0.3,
    coreEmissionStrength: 1.35,
  },
  animation: {
    displace1: 0.2,
    displace2: 0.1,
    noiseScroll: 0.85,
    magicScale: 1.5,
    magicDistortion: 1,
  },
  light: {
    enabled: true,
    color: new Color().setRGB(1, 0.539586, 0, 'srgb-linear'),
    baseIntensity: 2.4,
    flickerMin: 0.4,
    flickerMax: 1.6,
    distance: 12,
    decay: 2,
  },
};

export const FIRE_PRESETS: Record<string, FirePreset> = {
  emoji: EMOJI_FIRE_PRESET,
};

let activePreset: FirePreset = EMOJI_FIRE_PRESET;

export function getActiveFirePreset(): FirePreset {
  return activePreset;
}

export function setActiveFirePreset(preset: FirePreset | string): void {
  if (typeof preset === 'string') {
    activePreset = FIRE_PRESETS[preset] ?? EMOJI_FIRE_PRESET;
  } else {
    activePreset = preset;
  }
}
