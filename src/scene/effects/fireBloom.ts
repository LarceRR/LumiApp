import type { Camera, Scene, WebGLRenderer } from 'three';
import { Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { FIRE_BLOOM_DEFAULTS } from '@/scene/surface-objects/fire';

export type FireBloomOptions = {
  readonly strength?: number;
  readonly radius?: number;
  readonly threshold?: number;
};

/**
 * Builds an EffectComposer with RenderPass + UnrealBloomPass so Flame_Core's
 * emissive contribution blooms. Mount only when the GL backend supports it
 * (prefer web / high tier — bloom is expensive on mobile GPUs).
 */
export function createFireBloomComposer(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  width: number,
  height: number,
  options: FireBloomOptions = {},
): { composer: EffectComposer; bloomPass: UnrealBloomPass } {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new Vector2(Math.max(width, 1), Math.max(height, 1)),
    options.strength ?? FIRE_BLOOM_DEFAULTS.strength,
    options.radius ?? FIRE_BLOOM_DEFAULTS.radius,
    options.threshold ?? FIRE_BLOOM_DEFAULTS.threshold,
  );
  composer.addPass(bloomPass);

  return { composer, bloomPass };
}
