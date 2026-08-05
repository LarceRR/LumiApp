import { useFrame, useThree } from '@react-three/fiber/native';
import { useEffect, useMemo } from 'react';
import type { WebGLRenderer } from 'three';

import { FIRE_BLOOM_DEFAULTS } from '@/scene/objects/fire/fireSettings';
import { useFireSettingsStore } from '@/scene/objects/fire/fireSettingsStore';
import { useSceneStore } from '@/scene/stores/sceneStore';

import { BLOOM_MIPS, BLOOM_SAMPLES } from './bloomTuning';
import { HdrBloomPipeline } from './hdrBloomPipeline';

/**
 * Owns the frame. Mounted inside a Canvas it takes over rendering entirely
 * (useFrame priority > 0 switches react-three-fiber's own render off), pushes
 * the scene through the HDR bloom pipeline and puts the tone-mapped result on
 * screen.
 *
 * Drop it into any Canvas — the surface and the settings preview both use it,
 * so what you tune is exactly what you get.
 */
export function FireBloom(): null {
  const renderer = useThree((state) => state.gl) as WebGLRenderer;
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const tier = useSceneStore((state) => state.quality.tier);
  const antialias = useSceneStore((state) => state.quality.antialias);

  const pipeline = useMemo(
    () =>
      new HdrBloomPipeline({
        mips: BLOOM_MIPS[tier],
        samples: antialias ? BLOOM_SAMPLES : 0,
      }),
    [tier, antialias],
  );

  useEffect(() => () => pipeline.dispose(), [pipeline]);

  useFrame(() => {
    const bloom = useFireSettingsStore.getState().settings.bloom ?? FIRE_BLOOM_DEFAULTS;

    pipeline.render(renderer, scene, camera, bloom);
  }, 1);

  return null;
}
