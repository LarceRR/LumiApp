import { useEffect, useRef } from 'react';

import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { objectYawRadians } from '@/scene/objects/core/objectYaw';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { cellToWorld } from '@/scene/surface/cellToWorld';

/**
 * Opening the app should not drop you in an empty field.
 *
 * The first time a space's objects arrive — on launch, and again after a fresh
 * sign-in, since the space key changes — the camera is placed in front of the
 * newest object's face. Runs once per space, so it never fights a user who has
 * already started panning.
 */
export function useInitialFraming(spaceKey: string | null): void {
  const frameObject = useCameraStore((state) => state.frameObject);
  const newestId = useSurfaceObjectsStore((state) =>
    state.order.length === 0 ? null : (state.order[state.order.length - 1] ?? null),
  );
  const framedSpaceRef = useRef<string | null>(null);

  useEffect(() => {
    const key = spaceKey ?? '__default__';

    if (framedSpaceRef.current === key || newestId === null) {
      return;
    }

    const newest = useSurfaceObjectsStore.getState().byId[newestId];

    if (newest === undefined) {
      return;
    }

    framedSpaceRef.current = key;

    const world = cellToWorld(newest.cell);

    frameObject(
      { x: world.x, y: 0, z: world.z },
      objectYawRadians(newestId),
      surfaceObjectMotion.open.distanceFactor,
    );
  }, [frameObject, newestId, spaceKey]);
}
