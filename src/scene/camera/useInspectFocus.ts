import { useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cameraMotion } from '@/design-system/motion/camera';
import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import type { SurfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { modelExtentsForKind } from '@/scene/objects/core/modelExtents';
import { modelScreenBounds } from '@/scene/objects/core/modelScreenBounds';
import { objectYawRadians } from '@/scene/objects/core/objectYaw';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { useInspectStore } from '@/scene/stores/inspectStore';
import { cellToWorld } from '@/scene/surface/cellToWorld';

import { resolveFreeZone } from './freeZone';
import { solveInspectFraming } from './inspectFraming';

export type InspectFocus = (id: SurfaceObjectId) => boolean;

/**
 * Tap → framed inspect, in one place.
 *
 * Everything the camera needs is known before it moves: how big the model is
 * (from its own definition), how much room it gets (free zone, with the sheet
 * height predicted rather than measured, so the first tap of a session is as
 * accurate as the tenth) and therefore exactly which distance and target put it
 * in the middle of that room. The angle is whatever the user is looking from,
 * including straight down.
 */
export function useInspectFocus(): InspectFocus {
  const { width, height } = useWindowDimensions();
  const safeAreaTop = useSafeAreaInsets().top;

  return useCallback(
    (id) => {
      const object = useSurfaceObjectsStore.getState().byId[id];

      if (object === undefined) {
        return false;
      }

      const viewport = { width, height };
      const { orbit, defaultDistance, startFocusTour } = useCameraStore.getState();
      const world = cellToWorld(object.cell);
      const freeZone = resolveFreeZone({
        viewportWidth: width,
        viewportHeight: height,
        safeAreaTop,
      });
      // One pass at the current pose resolves the envelope (and honours the manual
      // pixel override, which is authored against what is on screen right now).
      const current = modelScreenBounds({
        id,
        kind: object.kind,
        cell: object.cell,
        viewport,
        orbit,
      });
      const extents = current?.extents ?? modelExtentsForKind(object.kind);
      const framing = solveInspectFraming({
        world,
        extents,
        viewport,
        azimuth: orbit.azimuth,
        elevation: orbit.elevation,
        freeZone,
        startDistance: defaultDistance * surfaceObjectMotion.inspect.distanceFactor,
        minDistance: defaultDistance * cameraMotion.inspectMinDistanceFactor,
        maxDistance: defaultDistance * cameraMotion.maxDistanceFactor,
      });
      const framed = modelScreenBounds({
        id,
        kind: object.kind,
        cell: object.cell,
        viewport,
        orbit: {
          azimuth: orbit.azimuth,
          elevation: framing.elevation,
          distance: framing.distance,
          target: framing.target,
        },
        extents,
      });

      useSurfaceObjectsStore.getState().select(id);
      useInspectStore.getState().setFreeZone(freeZone);
      useInspectStore.getState().setHitbox(framed);
      startFocusTour(world, objectYawRadians(id), {
        mode: 'inspect',
        framing: {
          target: framing.target,
          distance: framing.distance,
          elevation: framing.elevation,
        },
      });

      return true;
    },
    [height, safeAreaTop, width],
  );
}
