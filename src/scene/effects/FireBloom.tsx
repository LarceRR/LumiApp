import { useFrame, useThree } from '@react-three/fiber/native';
import { useEffect, useMemo } from 'react';
import type { WebGLRenderer } from 'three';

import { useFireSettingsStore } from '@/scene/objects/fire/fireSettingsStore';
import { useSceneStore } from '@/scene/stores/sceneStore';

import { BLOOM_MIPS } from './bloomTuning';
import { HdrBloomPipeline } from './hdrBloomPipeline';

/**
 * Owns the frame. Mounted inside a Canvas it takes rendering over entirely
 * (useFrame priority > 0 switches react-three-fiber's own render off), pushes
 * the scene through the HDR bloom pipeline and puts the tone-mapped result on
 * screen.
 *
 * Expo GL does not implement renderbufferStorageMultisample(), so the offscreen
 * pipeline deliberately uses single-sample targets. Canvas antialiasing is a
 * separate native surface feature and remains enabled where supported.
 */
export function FireBloom(): null {
  const renderer = useThree((state) => state.gl) as WebGLRenderer;
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const tier = useSceneStore((state) => state.quality.tier);

  const pipeline = useMemo(
    () => new HdrBloomPipeline({ mips: BLOOM_MIPS[tier], samples: 0 }),
    [tier],
  );

  useEffect(() => () => pipeline.dispose(), [pipeline]);

  useFrame(() => {
    pipeline.render(renderer, scene, camera, useFireSettingsStore.getState().settings.bloom);
  }, 1);

  return null;
}
