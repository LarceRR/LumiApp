import { useFrame, useThree } from '@react-three/fiber/native';
import { useLayoutEffect, useRef } from 'react';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

import { createFireBloomComposer, type FireBloomOptions } from './fireBloom';

export type FireBloomProps = FireBloomOptions & {
  /** When false, default R3F rendering is used (no composer). */
  readonly enabled?: boolean;
};

/** Optional UnrealBloomPass over the scene. Disabled by default on mobile GPUs. */
export function FireBloom({ enabled = false, strength, radius, threshold }: FireBloomProps): null {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const composerRef = useRef<EffectComposer | null>(null);

  useLayoutEffect(() => {
    if (!enabled) {
      composerRef.current = null;
      return;
    }

    const options: FireBloomOptions = {
      ...(strength === undefined ? {} : { strength }),
      ...(radius === undefined ? {} : { radius }),
      ...(threshold === undefined ? {} : { threshold }),
    };

    const { composer } = createFireBloomComposer(
      gl,
      scene,
      camera,
      size.width,
      size.height,
      options,
    );
    composerRef.current = composer;

    return () => {
      composer.dispose();
      composerRef.current = null;
    };
  }, [enabled, gl, scene, camera, size.width, size.height, strength, radius, threshold]);

  useFrame(() => {
    const composer = composerRef.current;
    if (!enabled || composer === null) {
      return;
    }

    composer.setSize(size.width, size.height);
    composer.render();
  }, 1);

  return null;
}
