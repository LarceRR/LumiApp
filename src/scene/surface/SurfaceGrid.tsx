// @refresh reset
import { useFrame, useThree } from '@react-three/fiber/native';
import { memo, type ReactElement, useLayoutEffect, useMemo, useRef } from 'react';
import { type Group, type Mesh, NoToneMapping, PlaneGeometry } from 'three';

import { cameraMotion } from '@/design-system/motion/camera';
import { useTheme } from '@/design-system/theme';
import {
  selectSurfaceBackground,
  useSettingsStore,
} from '@/domains/settings/presentation/stores/settingsStore';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { useCameraStore } from '@/scene/stores/cameraStore';

import { SURFACE_CELL_WORLD_SIZE } from './constants';
import { computeInfiniteGridCells, snapToCellGrid } from './infiniteSpan';
import {
  applyEndpointCellUniforms,
  applySurfaceFogUniforms,
  applySurfaceThemeUniforms,
  createSurfaceGridMaterial,
} from './surfaceGridMaterial';
import { resolveSurfaceBackground } from './surfaceTheme';

function SurfaceGridComponent(): ReactElement {
  const fillRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const lastSpanRef = useRef(0);
  const gl = useThree((state) => state.gl);
  const viewport = useThree((state) => state.viewport);
  const { scene } = useTheme();
  const configuredBackground = useSettingsStore(selectSurfaceBackground);
  const background = resolveSurfaceBackground(configuredBackground, scene.background);
  const surfaceMaterial = useMemo(() => createSurfaceGridMaterial(), []);

  useLayoutEffect(() => {
    gl.setClearColor(background, 1);
    gl.toneMapping = NoToneMapping;
    applySurfaceThemeUniforms(surfaceMaterial, background);
  }, [gl, background, surfaceMaterial]);

  useFrame(() => {
    const { target, distance } = useCameraStore.getState().orbit;
    const { order, byId } = useSurfaceObjectsStore.getState();
    const highlightEndpoints = useSettingsStore.getState().highlightEndpoints;
    const spanCells = computeInfiniteGridCells(distance, viewport.aspect);
    const planeSize = spanCells * SURFACE_CELL_WORLD_SIZE;
    const originX = snapToCellGrid(target.x);
    const originZ = snapToCellGrid(target.z);

    fillRef.current?.position.set(originX, 0, originZ);
    applySurfaceFogUniforms(
      surfaceMaterial,
      distance,
      cameraMotion.fogNearFactor,
      cameraMotion.fogFarFactor,
    );

    const firstId = order[0];
    const lastId = order.length > 0 ? order[order.length - 1] : undefined;
    const first = firstId === undefined ? null : (byId[firstId]?.cell ?? null);
    const last = lastId === undefined ? null : (byId[lastId]?.cell ?? null);

    // Подсветка крайних объектов — переключатель в настройках сцены.
    applyEndpointCellUniforms(
      surfaceMaterial,
      highlightEndpoints ? first : null,
      highlightEndpoints ? last : null,
    );

    if (spanCells !== lastSpanRef.current && meshRef.current !== null) {
      lastSpanRef.current = spanCells;
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = new PlaneGeometry(planeSize, planeSize);
    }
  });

  const initialSize = useMemo(() => {
    const cells = computeInfiniteGridCells(20, viewport.aspect);
    return cells * SURFACE_CELL_WORLD_SIZE;
  }, [viewport.aspect]);

  return (
    <group ref={fillRef}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} material={surfaceMaterial}>
        <planeGeometry args={[initialSize, initialSize]} />
      </mesh>
    </group>
  );
}

export const SurfaceGrid = memo(SurfaceGridComponent);
