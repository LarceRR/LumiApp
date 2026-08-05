import { useFrame, useThree } from '@react-three/fiber/native';
import { useLayoutEffect } from 'react';
import { Color, Fog } from 'three';

import { cameraMotion } from '@/design-system/motion/camera';
import {
  selectSurfaceBackground,
  useSettingsStore,
} from '@/domains/settings/presentation/stores/settingsStore';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { fogDistanceBounds } from '@/scene/surface/surfaceGridMaterial';

/**
 * Backdrop + scene fog matching the surface shader, so fires fade into the haze
 * instead of popping when they leave the clear zone. Цвет берётся из настроек
 * сцены, поэтому смена фона перекрашивает и дымку.
 */
export function SceneAtmosphere(): null {
  const scene = useThree((state) => state.scene);
  const background = useSettingsStore(selectSurfaceBackground);

  useLayoutEffect(() => {
    const fill = new Color(background);
    scene.background = fill;
    scene.fog = new Fog(fill.clone(), 1, 100);

    return () => {
      scene.fog = null;
    };
  }, [scene, background]);

  useFrame(() => {
    const fog = scene.fog;

    if (!(fog instanceof Fog)) {
      return;
    }

    const { distance } = useCameraStore.getState().orbit;
    const bounds = fogDistanceBounds(
      distance,
      cameraMotion.fogNearFactor,
      cameraMotion.fogFarFactor,
    );
    fog.near = bounds.near;
    fog.far = bounds.far;
  });

  return null;
}
