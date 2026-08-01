import { type ReactElement, Suspense } from 'react';

import { CameraController } from '@/scene/camera/CameraController';
import { SceneAtmosphere } from '@/scene/effects/SceneAtmosphere';
import { SceneLighting } from '@/scene/lighting/SceneLighting';
import { SurfaceGrid } from '@/scene/surface/SurfaceGrid';
import { FireField } from '@/scene/surface-objects/fire';

/**
 * Scene graph for the surface map.
 * FireEmoji core/shell are bloom-ready. To enable UnrealBloomPass:
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
      <Suspense fallback={null}>
        <FireField />
      </Suspense>
    </>
  );
}
