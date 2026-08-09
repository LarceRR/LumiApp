import type { ReactElement } from 'react';

import { selectQuality, useSceneStore } from '@/scene/stores/sceneStore';

/** Key + optional fill light — no per-object lights (Frontend-plan performance rules). */
export function SceneLighting(): ReactElement {
  const enableFillLight = useSceneStore(selectQuality).enableFillLight;
  return <><ambientLight intensity={0.8} color="#fff2cc" /><directionalLight intensity={2.2} position={[5, 10, 4]} color="#ffd08a" />{enableFillLight ? <directionalLight intensity={0.7} position={[-4, 5, -3]} color="#8fb8ff" /> : null}</>;
}
