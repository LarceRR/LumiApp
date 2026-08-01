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
 * The voxel fire is bloom-ready. To enable UnrealBloomPass:
 *   import { FireBloom } from '@/scene/effects/FireBloom';
 *   <FireBloom enabled />
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
