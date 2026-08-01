import type { ReactElement } from 'react';

import { sceneColors } from '@/design-system/colors/colors';
import { selectQuality, useSceneStore } from '@/scene/stores/sceneStore';

/** Key + optional fill light — no per-object lights (Frontend-plan performance rules). */
export function SceneLighting(): ReactElement {
  const enableFillLight = useSceneStore(selectQuality).enableFillLight;

  return (
    <>
      <ambientLight intensity={1.05} color={sceneColors.keyLight} />
      <directionalLight intensity={0.95} position={[5, 10, 4]} color={sceneColors.keyLight} />
      {enableFillLight ? (
        <directionalLight intensity={0.4} position={[-4, 5, -3]} color={sceneColors.fillLight} />
      ) : null}
    </>
  );
}
