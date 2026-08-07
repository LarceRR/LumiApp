import { useEffect, useRef } from 'react';

import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { objectYawRadians } from '@/scene/objects/core/objectYaw';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { cellToWorld } from '@/scene/surface/cellToWorld';

/**
 * Open the app on the newest object rather than on empty grid.
 *
 * Runs once per space: after that the user owns the camera, and re-framing
 * every time the objects refetch would fight whatever they were looking at.
 * Objects arrive after the surface does, so this waits for the first non-empty
 * list instead of firing on mount.
 */
export function useInitialObjectFraming(spaceKey: string | null): void {
  const framedSpaceRef = useRef<string | null>(null);
  const frameObject = useCameraStore((state) => state.frameObject);

  const newest = useSurfaceObjectsStore((state) => {
    const id = state.order[state.order.length - 1];

    return id === undefined ? null : (state.byId[id] ?? null);
  });

  useEffect(() => {
    const key = spaceKey ?? '__default__';

    if (newest === null || framedSpaceRef.current === key) {
      return;
    }

    framedSpaceRef.current = key;

    const world = cellToWorld(newest.cell);
    frameObject({ x: world.x, y: 0, z: world.z }, objectYawRadians(newest.id));
  }, [newest, spaceKey, frameObject]);
}
