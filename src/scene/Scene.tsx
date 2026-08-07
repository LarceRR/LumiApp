import type { ReactElement } from 'react';

import { CameraController } from '@/scene/camera/CameraController';
import { FireBloom } from '@/scene/effects/FireBloom';
import { SceneAtmosphere } from '@/scene/effects/SceneAtmosphere';
import { SceneLighting } from '@/scene/lighting/SceneLighting';
import { VoxelFireField } from '@/scene/objects';
import { SurfaceGrid } from '@/scene/surface/SurfaceGrid';
import { FrameMetrics } from '@/scene/systems/FrameMetrics';

/** Scene graph for the surface map. */
export function Scene(): ReactElement {
  return (
    <>
      <SceneAtmosphere />
      <CameraController />
      <SceneLighting />
      <SurfaceGrid />
      <VoxelFireField />
      <FireBloom />
      <FrameMetrics />
    </>
  );
}
