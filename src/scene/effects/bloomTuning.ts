import type { QualityTier } from '@/scene/systems/qualityTier';
export const BLOOM_MAX_MIPS = 5;
export const BLOOM_SOFT_KNEE = 0.25;
export const BLOOM_SHOULDER = 0.75;
export const BLOOM_SAMPLES = 4;
export const BLOOM_MIPS: Readonly<Record<QualityTier, number>> = { low: 3, medium: 4, high: 5 };
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
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
export function brightPassContribution(
  luma: number,
  threshold: number,
  softKnee: number = BLOOM_SOFT_KNEE,
): number {
  const knee = Math.max(threshold * softKnee, Number.EPSILON);
  if (luma < threshold) return 0;
  const soft = Math.min(Math.max(luma - threshold + knee, 0), 2 * knee);
  const kneed = (soft * soft) / (4 * knee);
  return Math.max(kneed, luma - threshold);
}
