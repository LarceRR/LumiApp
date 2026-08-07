import { Canvas } from '@react-three/fiber/native';
import { memo, type ReactElement, useEffect, useMemo, useRef } from 'react';
import { useWindowDimensions } from 'react-native';

import { useColorSchemeToken } from '@/design-system/colors/colors';
import {
  selectSurfaceBackground,
  useSettingsStore,
} from '@/domains/settings/presentation/stores/settingsStore';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import type { SurfaceBounds } from '@/domains/surfaces/domain/value-objects/SurfaceBounds';
import type { Logger } from '@/shared/logger';
import { cameraConfig, defaultCameraDistance, defaultVisibleRows } from './camera/cameraConfig';
import { useInitialFraming } from './camera/useInitialFraming';
import { SurfaceOrbitControls } from './controls/SurfaceOrbitControls';
import { Scene } from './Scene';
import { useCameraStore } from './stores/cameraStore';
import { selectQuality, useSceneStore } from './stores/sceneStore';
import { cellToWorld } from './surface/cellToWorld';
import { resolveSurfaceLayout } from './surface/surfaceLayout';
import { resolveSurfaceBackground } from './surface/surfaceTheme';

export type SceneViewProps = {
  readonly bounds: SurfaceBounds | null;
  readonly logger: Logger;
  /** When this changes the camera re-frames once to the new surface centre. */
  readonly spaceKey?: string | null;
};

function SceneViewComponent({ bounds, logger, spaceKey = null }: SceneViewProps): ReactElement {
  const { height } = useWindowDimensions();
  const setDefaultDistance = useCameraStore((state) => state.setDefaultDistance);
  const setMapCenter = useCameraStore((state) => state.setMapCenter);
  const setTarget = useCameraStore((state) => state.setTarget);
  const scheme = useColorSchemeToken();
  const background = resolveSurfaceBackground(useSettingsStore(selectSurfaceBackground), scheme);
  const quality = useSceneStore(selectQuality);
  const framedSpaceRef = useRef<string | null>(null);

  const layout = useMemo(() => resolveSurfaceLayout(bounds), [bounds]);
  const focusWorld = useMemo(() => cellToWorld(layout.focusCell), [layout.focusCell]);

  const defaultDistance = useMemo(
    () => defaultCameraDistance(height, defaultVisibleRows(height)),
    [height],
  );

  // An empty surface has nothing to look at, so the camera falls back to the
  // centre. As soon as objects exist, `useInitialFraming` takes over.
  useInitialFraming(spaceKey);

  useEffect(() => {
    setDefaultDistance(defaultDistance);
    setMapCenter({ x: focusWorld.x, y: 0, z: focusWorld.z }, layout.focusCell);

    // Bounds expand when objects spawn — update the double-tap home without
    // yanking the live camera target back to the surface centre.
    const space = spaceKey ?? '__default__';
    const isEmpty = useSurfaceObjectsStore.getState().order.length === 0;

    if (framedSpaceRef.current !== space && isEmpty) {
      framedSpaceRef.current = space;
      setTarget({ x: focusWorld.x, y: 0, z: focusWorld.z });
    }

    logger.debug('scene.surface.layout', {
      bounds,
      defaultDistance,
      focusCell: layout.focusCell,
      reframed: framedSpaceRef.current === space,
    });
  }, [
    bounds,
    defaultDistance,
    focusWorld.x,
    focusWorld.z,
    layout.focusCell,
    logger,
    setDefaultDistance,
    setMapCenter,
    setTarget,
    spaceKey,
  ]);

  return (
    <SurfaceOrbitControls>
      <Canvas
        camera={{
          fov: cameraConfig.fov,
          near: cameraConfig.near,
          far: cameraConfig.far,
          position: [0, 4, 12],
        }}
        // The frame lives in an HDR render target sized to the drawing buffer,
        // so the pixel ratio is a memory budget now, not just a sharpness knob.
        dpr={quality.maxPixelRatio}
        // Antialiasing happens on that target (MSAA), not on the default
        // framebuffer we only ever blit a fullscreen quad into.
        gl={{ antialias: false }}
        style={{ flex: 1, backgroundColor: background }}
      >
        <Scene />
      </Canvas>
    </SurfaceOrbitControls>
  );
}

export const SceneView = memo(SceneViewComponent);
