import { useFrame } from '@react-three/fiber/native';
import { useEffect, useRef } from 'react';

import { useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';

import { useSceneStore } from '../stores/sceneStore';

/** Averaging window. Short enough to feel live, long enough not to flicker. */
const SAMPLE_SECONDS = 0.5;

/**
 * Measures the render loop and publishes FPS to the scene store.
 *
 * Nothing was writing metrics before, which is why the overlay always read
 * zero. Sampling only runs while the overlay is on, so the store is not being
 * written 60 times a second for nobody.
 */
export function FpsMeter(): null {
  const enabled = useSettingsStore((state) => state.showPerformanceOverlay);
  const frames = useRef(0);
  const elapsed = useRef(0);

  useEffect(() => {
    frames.current = 0;
    elapsed.current = 0;

    if (!enabled) {
      useSceneStore.getState().setMetrics({ fps: 0 });
    }
  }, [enabled]);

  useFrame((_, delta) => {
    if (!enabled) {
      return;
    }

    frames.current += 1;
    elapsed.current += delta;

    if (elapsed.current < SAMPLE_SECONDS) {
      return;
    }

    useSceneStore.getState().setMetrics({ fps: Math.round(frames.current / elapsed.current) });
    frames.current = 0;
    elapsed.current = 0;
  });

  return null;
}
