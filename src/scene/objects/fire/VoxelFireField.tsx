import { useFrame } from '@react-three/fiber/native';
import { memo, type ReactElement, useEffect, useMemo, useRef } from 'react';
import type { PointLight } from 'three';

import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import { useTheme } from '@/design-system/theme';
import { useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';
import { knownKinds } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { focusTourInspectYaw } from '@/scene/camera/focusTour';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { useSceneStore } from '@/scene/stores/sceneStore';
import { cellToWorld, type WorldPoint } from '@/scene/surface/cellToWorld';
import { dampOverMs } from '@/shared/utils/math';

import { isLostInFog, objectFogFactor, viewDepth } from '../core/fogVisibility';
import { objectAnimationPlaying, objectOpacityTarget } from '../core/objectFocus';
import { objectYawRadians } from '../core/objectYaw';
import { selectVisibleObjects } from '../core/selectVisibleObjects';
import { VoxelFireEmitter } from './fireEmitter';
import { FIRE_LIGHT, fireLightIntensity } from './fireLight';
import { useFireSettingsStore } from './fireSettingsStore';
import { FIRE_LAYER_CAPACITY, VoxelFireLayers } from './voxelFireLayers';

/** Longest frame the simulation will integrate, so a stall never blows the fire up. */
const MAX_FRAME_SECONDS = 0.05;

/**
 * Every fire on the surface: two instanced layers of emissive voxels.
 *
 * Nothing here is loaded from disk: the fire is pure geometry + shader, tuned
 * live from the fire settings store. The glow is not drawn here either — the
 * particles simply emit above 1.0 and the HDR bloom pass turns that into light.
 * Objects that drift past the scene fog stop simulating entirely — they are
 * invisible anyway.
 */
function VoxelFireFieldComponent(): ReactElement {
  const tier = useSceneStore((state) => state.quality.tier);
  const settings = useFireSettingsStore((state) => state.settings);
  const { scene } = useTheme();

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
    const { orbit, focusTour } = useCameraStore.getState();
    const { byId, order, spawningId, selectedId } = useSurfaceObjectsStore.getState();
    const maxInstances = useSceneStore.getState().quality.maxInstancesPerKind;

    // Non-zero only while an inspect tour is running: the focused object turns
    // out of its resting surface pose to meet the viewer.
    const inspectYaw = focusTour === null ? 0 : focusTourInspectYaw(focusTour);

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

      // Resting tilt is deterministic per id, so nothing jitters between frames.
      const yaw = objectYawRadians(item.id) + (isFocused ? inspectYaw : 0);

      layers.write(emitter, world, fire, yaw);

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
        color={scene.fireLight}
        distance={FIRE_LIGHT.distance}
        decay={FIRE_LIGHT.decay}
        intensity={0}
        visible={false}
      />
    </>
  );
}

export const VoxelFireField = memo(VoxelFireFieldComponent);
