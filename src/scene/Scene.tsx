import type { ReactElement } from 'react';

import { CameraController } from '@/scene/camera/CameraController';
import { SceneAtmosphere } from '@/scene/effects/SceneAtmosphere';
import { SceneLighting } from '@/scene/lighting/SceneLighting';
import { VoxelFireField } from '@/scene/objects';
import { SurfaceGrid } from '@/scene/surface/SurfaceGrid';

/**
 * Scene graph for the surface map.
 *
 * Object fields come from `@/scene/objects` — importing that module registers
 * every kind, so adding one is a single line here. Nothing loads from disk:
 * the fire is geometry + shader, so there is no Suspense boundary to keep.
 *
 * Свечение огня — это билборд внутри самого поля объектов, а не постпроцесс:
 * EffectComposer на react-native не запускается. Настройки — в разделе
 * «Свечение» на экране настройки огня.
 */
export function Scene(): ReactElement {
  return (
    <>
      <SceneAtmosphere />
      <CameraController />
      <SceneLighting />
      <SurfaceGrid />
      <VoxelFireField />
    </>
  );
}
