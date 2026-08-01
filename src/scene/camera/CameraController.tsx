import { useFrame, useThree } from '@react-three/fiber/native';
import { useEffect } from 'react';
import type { PerspectiveCamera } from 'three';

import { cameraConfig, orbitPosition } from '@/scene/camera/cameraConfig';
import { useCameraStore } from '@/scene/stores/cameraStore';

/** Applies orbit state to the scene camera every frame. */
export function CameraController(): null {
  const camera = useThree((state) => state.camera as PerspectiveCamera);

  useEffect(() => {
    camera.fov = cameraConfig.fov;
    camera.near = cameraConfig.near;
    camera.far = cameraConfig.far;
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame((_, deltaSeconds) => {
    const store = useCameraStore.getState();
    store.tickFocusTour(deltaSeconds);
    store.tickRecenter(deltaSeconds);
    store.tickMomentum(deltaSeconds);

    const orbit = useCameraStore.getState().orbit;
    const position = orbitPosition(orbit);
    camera.position.set(position.x, position.y, position.z);
    camera.lookAt(orbit.target.x, orbit.target.y, orbit.target.z);
    camera.updateProjectionMatrix();
  });

  return null;
}
