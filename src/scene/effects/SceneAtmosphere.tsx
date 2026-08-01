import { useFrame, useThree } from '@react-three/fiber/native';
import { useLayoutEffect } from 'react';
import { Color, Fog } from 'three';

import { cameraMotion } from '@/design-system/motion/camera';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { surfaceVisual } from '@/scene/surface/constants';
import { fogDistanceBounds } from '@/scene/surface/surfaceGridMaterial';

/**
 * White backdrop + scene fog matching the surface shader, so fires fade into
 * the haze instead of popping when they leave the clear zone.
 */
export function SceneAtmosphere(): null {
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    const fill = new Color(surfaceVisual.fill);
    scene.background = fill;
    scene.fog = new Fog(fill, 1, 100);

    return () => {
      scene.fog = null;
    };
  }, [scene]);

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
