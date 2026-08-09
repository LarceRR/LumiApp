import type { ModelLocalBounds } from '../core/modelScreenBounds';
import type { FireLayerSettings, FireSettings } from './fireSettings';

function layerHalfWidth(layer: FireLayerSettings): number {
  return layer.spread / 2 + layer.scaleTo.max;
}

function layerHeight(layer: FireLayerSettings): number {
  return layer.rangeY + layer.scaleTo.max;
}

/**
 * The fire has no mesh to measure: it is a particle cloud, so its bounds are
 * derived from the same knobs that shape it.
 *
 * `rangeY` is the right height to use, not `speedMax * lifeTime`. The colour
 * ramp reaches its dim end at `rangeY`, and everything above that has already
 * faded out — measuring the last invisible ember would describe a box roughly
 * twice as tall as the flame anyone can see.
 */
export function fireModelBounds(settings: FireSettings): ModelLocalBounds {
  const scale = settings.worldScale;

  return {
    halfWidth: Math.max(layerHalfWidth(settings.ember), layerHalfWidth(settings.flame)) * scale,
    height: Math.max(layerHeight(settings.ember), layerHeight(settings.flame)) * scale,
  };
}
