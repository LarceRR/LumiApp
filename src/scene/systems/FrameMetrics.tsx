import { useFrame } from '@react-three/fiber/native';
import { useEffect, useRef } from 'react';

import { useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';
import { useSceneStore } from '@/scene/stores/sceneStore';

/** Averaging window. Short enough to feel live, long enough not to strobe. */
const SAMPLE_SECONDS = 0.5;

/**
 * Frame-rate probe.
 *
 * The overlay used to read a permanent 0 because nothing in the app ever called
 * `setMetrics`. Sampling happens on the render loop and the store is only
 * written twice a second, so the counter cannot itself cause re-render churn.
 */
export function FrameMetrics(): null {
  const enabled = useSettingsStore((state) => state.showPerformanceOverlay);
  const framesRef = useRef(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      useSceneStore.getState().setMetrics({ fps: 0 });
    }

    framesRef.current = 0;
    elapsedRef.current = 0;
  }, [enabled]);

  useFrame((_, delta) => {
    if (!enabled) {
      return;
    }

    framesRef.current += 1;
    elapsedRef.current += delta;

    if (elapsedRef.current < SAMPLE_SECONDS) {
      return;
    }

    useSceneStore.getState().setMetrics({
      fps: Math.round(framesRef.current / elapsedRef.current),
    });

    framesRef.current = 0;
    elapsedRef.current = 0;
  });

  return null;
}
