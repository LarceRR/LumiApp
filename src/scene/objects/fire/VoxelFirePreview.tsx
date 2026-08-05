import { useFrame, useThree } from '@react-three/fiber/native';
import { memo, type ReactElement, useEffect, useMemo } from 'react';

import { FireBloom } from '@/scene/effects/FireBloom';

import type { ObjectPreviewProps } from '../core/SurfaceObjectDefinition';
import { VoxelFireEmitter } from './fireEmitter';
import { useFireSettingsStore } from './fireSettingsStore';
import { FIRE_PREVIEW_CAPACITY, VoxelFireLayers } from './voxelFireLayers';

const ORIGIN = { x: 0, y: 0, z: 0 } as const;
const MAX_FRAME_SECONDS = 0.05;
/** Radians per second of the endless idle spin. */
const SPIN_SPEED = 0.35;
const ORBIT_RADIUS = 1.9;
const ORBIT_HEIGHT = 0.72;
const LOOK_AT_HEIGHT = 0.4;

/**
 * One fire, alone, always burning — the settings sheet preview.
 *
 * The camera orbits the fire instead of the fire spinning, so the colour ramp
 * (driven by world height) stays exactly as it looks on the surface. Same bloom
 * pass as the surface too: the sliders show the real thing, not an
 * approximation of it.
 */
function VoxelFirePreviewComponent({ yawRef }: ObjectPreviewProps): ReactElement {
  const camera = useThree((state) => state.camera);
  const settings = useFireSettingsStore((state) => state.settings);

  const layers = useMemo(() => new VoxelFireLayers(FIRE_PREVIEW_CAPACITY), []);
  const emitter = useMemo(() => new VoxelFireEmitter(settings, true), [settings]);

  useEffect(() => () => layers.dispose(), [layers]);

  useEffect(() => {
    layers.applyUniforms(settings);
  }, [layers, settings]);

  useFrame((_, delta) => {
    const fire = useFireSettingsStore.getState().settings;

    emitter.opacity = 1;
    emitter.configure(fire, true);
    emitter.update(Math.min(delta, MAX_FRAME_SECONDS) * fire.globalSpeed, fire);

    layers.begin();
    layers.write(emitter, ORIGIN, fire);
    layers.commit();

    yawRef.current += delta * SPIN_SPEED;
    camera.position.set(
      Math.sin(yawRef.current) * ORBIT_RADIUS,
      ORBIT_HEIGHT,
      Math.cos(yawRef.current) * ORBIT_RADIUS,
    );
    camera.lookAt(0, LOOK_AT_HEIGHT, 0);
  });

  return (
    <>
      <primitive object={layers.emberMesh} />
      <primitive object={layers.flameMesh} />
      <FireBloom />
    </>
  );
}

export const VoxelFirePreview = memo(VoxelFirePreviewComponent);
