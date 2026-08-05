import type { QualityTier } from '@/scene/systems/qualityTier';

/** Widest mip chain the composite shader is generated for. */
export const BLOOM_MAX_MIPS = 5;

/**
 * Soft-knee width as a fraction of the threshold. Keeps the bright pass from
 * switching on abruptly, without dragging midtones into the glow.
 */
export const BLOOM_SOFT_KNEE = 0.25;

/**
 * Where the highlight roll-off starts. Anything below this value survives the
 * composite untouched — the surface, the grid and the UI keep their colours.
 */
export const BLOOM_SHOULDER = 0.75;

/** MSAA samples for the HDR scene target, when the device can do it. */
export const BLOOM_SAMPLES = 4;

/** Blur levels per quality tier. More levels = wider, softer halo. */
export const BLOOM_MIPS: Readonly<Record<QualityTier, number>> = {
  low: 3,
  medium: 4,
  high: 5,
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Per-mip weights, normalised so the total bloom energy does not change with
 * the mip count — a low-end phone gets the same brightness, just a coarser
 * halo.
 *
 * radius 0 keeps the energy in the tight mips (small hot halo), radius 1 pushes
 * it into the wide ones (soft, far-reaching glow).
 */
export function bloomMipWeights(radius: number, mips: number): readonly number[] {
  const blend = clamp01(radius);
  const count = Math.max(1, Math.min(Math.floor(mips), BLOOM_MAX_MIPS));
  const raw: number[] = [];

  for (let index = 0; index < count; index += 1) {
    const tight = 1 - index / BLOOM_MAX_MIPS;
    raw.push(tight * (1 - blend) + (1.2 - tight) * blend);
  }

  const total = raw.reduce((sum, weight) => sum + weight, 0);

  return total <= 0 ? raw.map(() => 1 / count) : raw.map((weight) => weight / total);
}

/**
 * The bright-pass curve, mirrored on the CPU so it can be reasoned about — and
 * tested — outside the shader. Returns the absolute luminance that survives.
 */
export function brightPassContribution(
  luma: number,
  threshold: number,
  softKnee: number = BLOOM_SOFT_KNEE,
): number {
  const knee = threshold * softKnee + 1e-5;
  const soft = Math.min(Math.max(luma - threshold + knee, 0), 2 * knee);
  const kneed = (soft * soft) / (4 * knee + 1e-5);

  return Math.max(kneed, luma - threshold);
}
