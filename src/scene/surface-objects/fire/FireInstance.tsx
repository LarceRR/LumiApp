import { useGLTF } from '@react-three/drei/native';
import { useFrame } from '@react-three/fiber/native';
import { memo, type ReactElement, useLayoutEffect, useMemo, useRef } from 'react';
import type { Group, Object3D, PointLight } from 'three';

import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';
import type { SurfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { focusTourObjectPose } from '@/scene/camera/focusTour';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { cellToWorld } from '@/scene/surface/cellToWorld';
import { dampOverMs } from '@/shared/utils/math';

import { getActiveFirePreset } from './fireConfig';
import { FIRE_POINT_LIGHT, firePointLightColor } from './fireCoreMaterial';
import {
  cloneFireMaterials,
  disposeFireMaterials,
  fitFireToCell,
  prepareFireMaterials,
  setFireMaterialsOpacity,
  tickFireMaterials,
} from './fireFit';
import { fireLightFlickerIntensity } from './fireLightFlicker';
import { fireYawRadians } from './fireYaw';
import { fireAnimationPlaying, spawnFocusOpacityTarget } from '../spawnFocusOpacity';

export type FireInstanceProps = {
  readonly id: SurfaceObjectId;
  readonly cell: Cell;
  readonly template: Object3D;
  readonly fit: ReturnType<typeof fitFireToCell>;
};

/**
 * One visible fire. Geometry is shared with the template; materials are cloned
 * so spawn-dimming does not tint the whole field. Flame animation runs only
 * during the spawn window or while this fire is inspect-focused.
 */
function FireInstanceComponent({ id, cell, template, fit }: FireInstanceProps): ReactElement {
  const groupRef = useRef<Group>(null);
  const lightRef = useRef<PointLight>(null);
  const opacityRef = useRef(1);
  const playTimeRef = useRef(0);
  const wasPlayingRef = useRef(false);
  const spawnStartedAtRef = useRef<number | null>(null);
  const lightColor = useMemo(() => firePointLightColor(), []);
  const yawSeed = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash * 31 + id.charCodeAt(i)) | 0;
    }
    return (hash >>> 0) % 1000;
  }, [id]);

  const { model, materials } = useMemo(() => {
    const cloned = template.clone(true);
    return { model: cloned, materials: cloneFireMaterials(cloned) };
  }, [template]);

  const world = cellToWorld(cell);
  const baseYaw = useMemo(() => fireYawRadians(id), [id]);

  useLayoutEffect(() => {
    return () => {
      model.removeFromParent();
      disposeFireMaterials(materials);
    };
  }, [model, materials]);

  useFrame((_, delta) => {
    const group = groupRef.current;

    if (group === null) {
      return;
    }

    const { spawningId, selectedId } = useSurfaceObjectsStore.getState();
    const { focusTour, orbit, defaultDistance } = useCameraStore.getState();
    const isSpawning = spawningId === id;
    const isSelected = selectedId === id;
    const focusDistance = defaultDistance * surfaceObjectMotion.spawn.focusDistanceFactor;

    if (isSpawning && spawnStartedAtRef.current === null) {
      spawnStartedAtRef.current = performance.now();
    }

    const spawnElapsedMs =
      spawnStartedAtRef.current === null
        ? Number.POSITIVE_INFINITY
        : performance.now() - spawnStartedAtRef.current;

    const playing = fireAnimationPlaying({
      isSpawning,
      spawnElapsedMs,
      isSelected,
      focusTourActive: focusTour !== null,
      cameraDistance: orbit.distance,
      focusDistance,
    });

    if (playing) {
      if (!wasPlayingRef.current) {
        playTimeRef.current = 0;
      }
      playTimeRef.current += delta;
      tickFireMaterials(materials, playTimeRef.current);
    } else {
      tickFireMaterials(materials, 0);
    }
    wasPlayingRef.current = playing;

    const dimOthers = focusTour !== null || selectedId !== null;
    const target = spawnFocusOpacityTarget(isSpawning || isSelected, dimOthers);
    const nextOpacity = dampOverMs(
      opacityRef.current,
      target,
      surfaceObjectMotion.dim.fadeMs,
      delta,
    );

    if (Math.abs(nextOpacity - opacityRef.current) > 1e-4) {
      opacityRef.current = nextOpacity;
      setFireMaterialsOpacity(materials, nextOpacity);
    } else if (opacityRef.current !== target) {
      opacityRef.current = target;
      setFireMaterialsOpacity(materials, target);
    }

    let yaw = baseYaw;
    let lift = 0;

    if (isSpawning && focusTour !== null && focusTour.spinTurns > 0) {
      const pose = focusTourObjectPose(focusTour);
      yaw = baseYaw + pose.spinRadians;
      lift = pose.heightFactor * surfaceObjectMotion.spawn.dropHeight;
    }

    group.rotation.y = yaw;
    group.position.set(world.x + fit.offset[0], fit.offset[1] + lift, world.z + fit.offset[2]);

    const light = lightRef.current;
    if (light !== null) {
      light.visible = playing;
      if (playing) {
        light.intensity = fireLightFlickerIntensity(playTimeRef.current, yawSeed);
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[world.x + fit.offset[0], fit.offset[1], world.z + fit.offset[2]]}
      scale={fit.scale}
    >
      <primitive object={model} />
      <pointLight
        ref={lightRef}
        color={lightColor}
        intensity={FIRE_POINT_LIGHT.baseIntensity}
        distance={FIRE_POINT_LIGHT.distance}
        decay={FIRE_POINT_LIGHT.decay}
        position={[0, 0, 0]}
        visible={false}
      />
    </group>
  );
}

export const FireInstance = memo(FireInstanceComponent);

/** Shared template: loaded once, materials prepared once, cloned per visible fire. */
export function useFireTemplate(): {
  readonly template: Object3D;
  readonly fit: ReturnType<typeof fitFireToCell>;
} {
  const modelAsset = getActiveFirePreset().modelAsset;
  const { scene } = useGLTF(modelAsset);

  return useMemo(() => {
    const template = scene.clone(true);
    prepareFireMaterials(template);
    const fit = fitFireToCell(template);

    return { template, fit };
  }, [scene]);
}
