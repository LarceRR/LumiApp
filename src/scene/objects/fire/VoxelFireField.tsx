import { useFrame } from '@react-three/fiber/native';
import { memo, type ReactElement, useEffect, useMemo, useRef } from 'react';
import type { PointLight } from 'three';

import { sceneColors } from '@/design-system/colors/colors';
import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import { useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';
import { knownKinds } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { useSceneStore } from '@/scene/stores/sceneStore';
import { cellToWorld, type WorldPoint } from '@/scene/surface/cellToWorld';
import { dampOverMs } from '@/shared/utils/math';

import { isLostInFog, objectFogFactor, viewDepth } from '../core/fogVisibility';
import { objectAnimationPlaying, objectOpacityTarget } from '../core/objectFocus';
import { selectVisibleObjects } from '../core/selectVisibleObjects';
import { VoxelFireEmitter } from './fireEmitter';
import { FIRE_LIGHT, fireLightIntensity } from './fireLight';
import { useFireSettingsStore } from './fireSettingsStore';
import { FIRE_LAYER_CAPACITY, VoxelFireLayers } from './voxelFireLayers';

/** Longest frame the simulation will integrate, so a stall never blows the fire up. */
const MAX_FRAME_SECONDS = 0.05;

/**
 * Every fire on the surface, drawn as two additive instanced layers.
 *
 * Nothing here is loaded from disk: the fire is pure geometry + shader, tuned
 * live from the fire settings store. Objects that drift past the scene fog stop
 * simulating entirely — they are invisible anyway.
 */
function VoxelFireFieldComponent(): ReactElement {
  const tier = useSceneStore((state) => state.quality.tier);
  const settings = useFireSettingsStore((state) => state.settings);

  const lightRef = useRef<PointLight>(null);
  const emittersRef = useRef(new Map<string, VoxelFireEmitter>());
  const elapsedRef = useRef(0);

  const layers = useMemo(() => new VoxelFireLayers(FIRE_LAYER_CAPACITY[tier]), [tier]);

  useEffect(() => {
    const emitters = emittersRef.current;

    return () => {
      emitters.clear();
      layers.dispose();
    };
  }, [layers]);

  useEffect(() => {
    layers.applyUniforms(settings);
  }, [layers, settings]);

  useFrame((_, delta) => {
    const fire = useFireSettingsStore.getState().settings;
    const reduceMotion = useSettingsStore.getState().reduceMotion;
    const { orbit } = useCameraStore.getState();
    const { byId, order, spawningId, selectedId } = useSurfaceObjectsStore.getState();
    const maxInstances = useSceneStore.getState().quality.maxInstancesPerKind;

    const candidates = order.flatMap((id) => {
      const object = byId[id];

      if (object === undefined) {
        return [];
      }

      return [{ id: object.id, cell: object.cell, kind: object.kind, inFrustum: true }];
    });

    const visible = selectVisibleObjects({
      objects: candidates,
      kind: knownKinds.fire,
      spawningId,
      maxInstances,
      target: orbit.target,
      cellToWorld,
      viewDepth: (world) => {
        const position = { x: world.x, y: 0, z: world.z };

        return isLostInFog(objectFogFactor(position, orbit))
          ? null
          : viewDepth(position, orbit);
      },
    });

    const simDelta = Math.min(delta, MAX_FRAME_SECONDS) * fire.globalSpeed;
    const dimOthers = selectedId !== null || spawningId !== null;
    const emitters = emittersRef.current;
    const alive = new Set<string>();
    let focusWorld: WorldPoint | null = null;

    layers.begin();

    for (const item of visible) {
      alive.add(item.id);

      const world = cellToWorld(item.cell);
      const isFocused = item.id === selectedId || item.id === spawningId;

      let emitter = emitters.get(item.id);

      if (emitter === undefined) {
        emitter = new VoxelFireEmitter(fire, isFocused);
        emitters.set(item.id, emitter);
      }

      const fog = objectFogFactor(world, orbit);
      const playing = objectAnimationPlaying({ fogFactor: fog, reduceMotion });
      const target = objectOpacityTarget(isFocused, dimOthers) * (1 - fog);

      emitter.opacity = dampOverMs(
        emitter.opacity,
        target,
        surfaceObjectMotion.dim.fadeMs,
        delta,
      );
      emitter.configure(fire, isFocused);
      emitter.update(playing ? simDelta : 0, fire);

      layers.write(emitter, world, fire.worldScale);

      if (isFocused) {
        focusWorld = world;
      }
    }

    for (const id of [...emitters.keys()]) {
      if (!alive.has(id)) {
        emitters.delete(id);
      }
    }

    layers.commit();

    elapsedRef.current += delta;
    const light = lightRef.current;

    if (light !== null) {
      light.visible = focusWorld !== null && !reduceMotion;

      if (focusWorld !== null) {
        light.position.set(focusWorld.x, fire.worldScale * 1.2, focusWorld.z);
        light.intensity = fireLightIntensity(elapsedRef.current);
      }
    }
  });

  return (
    <>
      <primitive object={layers.emberMesh} />
      <primitive object={layers.flameMesh} />
      <pointLight
        ref={lightRef}
        color={sceneColors.fireLight}
        distance={FIRE_LIGHT.distance}
        decay={FIRE_LIGHT.decay}
        intensity={0}
        visible={false}
      />
    </>
  );
}

export const VoxelFireField = memo(VoxelFireFieldComponent);
