import { type ModelExtents, rangeQuantile } from '../core/modelExtents';
import type { FireSettings } from './fireSettings';

/**
 * Share of each authored range treated as "the model".
 *
 * The flame layer scatters particle speed, life and size. p85 is the body of the
 * fire you actually see; the last 15% is the odd tall particle that should never
 * decide how the camera frames anything.
 */
export const FIRE_CORE_QUANTILE = 0.85;

/** `FireParticleLayer.respawn` jitters life over [0.6, 1] of `lifeTime`. */
const LIFE_JITTER_MIN = 0.6;

/**
 * The fire's visual core, derived from its settings alone.
 *
 * No particle sampling: the answer must be identical the instant a fire is
 * tapped and a second later, otherwise framing depends on when you looked.
 * Embers are ignored on purpose — they are sparks, not the shape being framed.
 * A flame particle rises at `speed` for `life` seconds and swells toward
 * `scaleTo`; voxels are cubes, hence the half edge on top and at the sides.
 */
export function fireVisualCoreExtents(settings: FireSettings): ModelExtents {
  const { flame, worldScale } = settings;
  const speed = rangeQuantile(flame.speedMin, flame.speedMax, FIRE_CORE_QUANTILE);
  const life = flame.lifeTime * rangeQuantile(LIFE_JITTER_MIN, 1, FIRE_CORE_QUANTILE);
  const voxel = rangeQuantile(flame.scaleTo.min, flame.scaleTo.max, FIRE_CORE_QUANTILE);

  return {
    halfWidth: (flame.spread / 2 + voxel / 2) * worldScale,
    height: (speed * life + voxel / 2) * worldScale,
  };
}
