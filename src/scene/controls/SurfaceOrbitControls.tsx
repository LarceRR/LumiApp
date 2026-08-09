import { memo, type ReactElement, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { cameraMotion } from '@/design-system/motion/camera';
import { useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';
import { knownKinds } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { panDeltaFromScreen, worldUnitsPerPixel } from '@/scene/camera/cameraConfig';
import { getModelScreenBounds } from '@/scene/objects/core/modelScreenBounds';
import { objectYawRadians } from '@/scene/objects/core/objectYaw';
import { groundHitFromScreen, pickNearestObject } from '@/scene/objects/core/pickObjectAtScreen';
import { fireModelBounds } from '@/scene/objects/fire/fireModelBounds';
import { fireSettings } from '@/scene/objects/fire/fireSettingsStore';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { useHitboxStore } from '@/scene/stores/hitboxStore';
import { useSceneStore } from '@/scene/stores/sceneStore';
import { cellToWorld } from '@/scene/surface/cellToWorld';

export type SurfaceOrbitControlsProps = {
  readonly children: ReactElement;
};

type Sample2 = {
  readonly a: number;
  readonly b: number;
  readonly atMs: number;
};

const VELOCITY_WINDOW_MS = 100;

function velocityFromSamples(
  samples: readonly Sample2[],
  gain: number,
  max: number,
): { readonly a: number; readonly b: number } {
  const newest = samples[samples.length - 1];
  const oldest = samples[0];

  if (newest === undefined || oldest === undefined || samples.length < 2) {
    return { a: 0, b: 0 };
  }

  const elapsedMs = newest.atMs - oldest.atMs;

  if (elapsedMs <= 0) {
    return { a: 0, b: 0 };
  }

  let a = 0;
  let b = 0;

  for (const sample of samples) {
    a += sample.a;
    b += sample.b;
  }

  const elapsedSeconds = elapsedMs / 1000;
  const rawA = (a / elapsedSeconds) * gain;
  const rawB = (b / elapsedSeconds) * gain;

  return {
    a: Math.max(-max, Math.min(max, rawA)),
    b: Math.max(-max, Math.min(max, rawB)),
  };
}

function pushSample(samples: Sample2[], sample: Sample2): Sample2[] {
  const cutoff = sample.atMs - VELOCITY_WINDOW_MS;
  return [...samples.filter((entry) => entry.atMs >= cutoff), sample];
}

/**
 * One-hand friendly surface controls:
 * - 1 finger       → pan
 * - pinch          → zoom (+ subtle tilt when the pinch center shifts)
 * - two-finger twist → orbit heading
 */
function SurfaceOrbitControlsComponent({ children }: SurfaceOrbitControlsProps): ReactElement {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const panBy = useCameraStore((state) => state.panBy);
  const orbitBy = useCameraStore((state) => state.orbitBy);
  const zoomByFactor = useCameraStore((state) => state.zoomByFactor);
  const setOrbitVelocity = useCameraStore((state) => state.setOrbitVelocity);
  const setPanVelocity = useCameraStore((state) => state.setPanVelocity);
  const stopAllVelocity = useCameraStore((state) => state.stopAllVelocity);
  const cancelRecenter = useCameraStore((state) => state.cancelRecenter);
  const startRecenter = useCameraStore((state) => state.startRecenter);
  const setInteracting = useSceneStore((state) => state.setInteracting);

  const lastPinchScale = useRef(1);
  const lastPinchFocalY = useRef(0);
  const panSamples = useRef<Sample2[]>([]);
  const twistSamples = useRef<Sample2[]>([]);
  const lastPanTime = useRef(0);

  const beginInteraction = useCallback((): void => {
    cancelRecenter();
    stopAllVelocity();
    setInteracting(true);
  }, [cancelRecenter, setInteracting, stopAllVelocity]);

  const endInteraction = useCallback((): void => {
    setInteracting(false);
  }, [setInteracting]);

  const beginPan = useCallback((): void => {
    panSamples.current = [];
    lastPanTime.current = Date.now();
    beginInteraction();
  }, [beginInteraction]);

  const handlePanChange = useCallback(
    (changeX: number, changeY: number, screenX: number, screenY: number): void => {
      const orbit = useCameraStore.getState().orbit;
      const prevX = screenX - changeX;
      const prevY = screenY - changeY;

      const hitPrev = groundHitFromScreen(prevX, prevY, screenWidth, screenHeight, orbit);
      const hitCurr = groundHitFromScreen(screenX, screenY, screenWidth, screenHeight, orbit);

      let deltaX = 0;
      let deltaZ = 0;

      if (hitPrev !== null && hitCurr !== null) {
        deltaX = hitPrev.x - hitCurr.x;
        deltaZ = hitPrev.z - hitCurr.z;
      } else {
        const fallback = panDeltaFromScreen(
          changeX,
          changeY,
          orbit.azimuth,
          orbit.elevation,
          worldUnitsPerPixel(orbit.distance, screenHeight),
        );
        deltaX = fallback.x;
        deltaZ = fallback.z;
      }

      const now = Date.now();
      lastPanTime.current = now;
      panSamples.current = pushSample(panSamples.current, {
        a: deltaX,
        b: deltaZ,
        atMs: now,
      });
      panBy(deltaX, deltaZ);
    },
    [panBy, screenHeight, screenWidth],
  );

  const endPan = useCallback(
    (velocityX = 0, velocityY = 0): void => {
      const now = Date.now();
      // Stationary lift: finger held still before releasing -> zero release velocity
      if (now - lastPanTime.current > 60) {
        setPanVelocity({ x: 0, z: 0 });
        panSamples.current = [];
        endInteraction();
        return;
      }

      let velocity = velocityFromSamples(
        panSamples.current,
        cameraMotion.panInertiaGain,
        cameraMotion.panMaxVelocity,
      );

      if (velocityX !== 0 || velocityY !== 0) {
        const orbit = useCameraStore.getState().orbit;
        const nativeWorldVel = panDeltaFromScreen(
          velocityX,
          velocityY,
          orbit.azimuth,
          orbit.elevation,
          worldUnitsPerPixel(orbit.distance, screenHeight),
        );
        const gain = cameraMotion.panInertiaGain;
        velocity = {
          a: Math.max(
            -cameraMotion.panMaxVelocity,
            Math.min(cameraMotion.panMaxVelocity, nativeWorldVel.x * gain),
          ),
          b: Math.max(
            -cameraMotion.panMaxVelocity,
            Math.min(cameraMotion.panMaxVelocity, nativeWorldVel.z * gain),
          ),
        };
      }

      setPanVelocity({ x: velocity.a, z: velocity.b });
      panSamples.current = [];
      endInteraction();
    },
    [endInteraction, screenHeight, setPanVelocity],
  );

  const beginTwist = useCallback((): void => {
    twistSamples.current = [];
    beginInteraction();
  }, [beginInteraction]);

  const handleTwistChange = useCallback(
    (rotationChange: number): void => {
      const azimuth = rotationChange * cameraMotion.rotationGain;
      const now = Date.now();
      twistSamples.current = pushSample(twistSamples.current, {
        a: azimuth,
        b: 0,
        atMs: now,
      });
      orbitBy(azimuth, 0);
    },
    [orbitBy],
  );

  const endTwist = useCallback((): void => {
    const velocity = velocityFromSamples(
      twistSamples.current,
      cameraMotion.orbitInertiaGain,
      cameraMotion.orbitMaxVelocity,
    );
    setOrbitVelocity({ azimuth: velocity.a, elevation: 0 });
    twistSamples.current = [];
    endInteraction();
  }, [endInteraction, setOrbitVelocity]);

  const beginPinch = useCallback(
    (focalY: number): void => {
      lastPinchScale.current = 1;
      lastPinchFocalY.current = focalY;
      beginInteraction();
    },
    [beginInteraction],
  );

  const handlePinchChange = useCallback(
    (scale: number, focalY: number): void => {
      const previousScale = lastPinchScale.current;

      if (previousScale > 0) {
        zoomByFactor(previousScale / scale);
      }

      const deltaFocalY = focalY - lastPinchFocalY.current;
      if (deltaFocalY !== 0) {
        orbitBy(0, -deltaFocalY * cameraMotion.pinchElevationSensitivity);
      }

      lastPinchScale.current = scale;
      lastPinchFocalY.current = focalY;
    },
    [orbitBy, zoomByFactor],
  );

  const handleDoubleTap = useCallback((): void => {
    startRecenter();
  }, [startRecenter]);

  const handleSingleTap = useCallback(
    (screenX: number, screenY: number): void => {
      const camera = useCameraStore.getState();
      if (camera.focusTour !== null) {
        return;
      }

      const hit = groundHitFromScreen(screenX, screenY, screenWidth, screenHeight, camera.orbit);
      if (hit === null) {
        return;
      }

      const { order, byId, select } = useSurfaceObjectsStore.getState();
      const fires = order.flatMap((id) => {
        const object = byId[id];
        if (object === undefined || object.kind !== knownKinds.fire) {
          return [];
        }
        return [{ id: object.id, cell: object.cell }];
      });
      const picked = pickNearestObject(hit, fires);
      if (picked === null) {
        return;
      }

      const world = cellToWorld(picked.cell);
      const origin = { x: world.x, y: 0, z: world.z };
      const bounds = fireModelBounds(fireSettings());
      const hitboxes = useHitboxStore.getState();

      // Snapshot before the camera starts moving: the box has to describe what the
      // picker saw at the moment of the tap, not where the object ends up.
      if (useSettingsStore.getState().showHitbox) {
        hitboxes.capture(
          getModelScreenBounds({
            id: picked.id,
            cell: picked.cell,
            origin,
            local: bounds,
            orbit: camera.orbit,
            viewport: { width: screenWidth, height: screenHeight },
          }),
        );
      } else {
        hitboxes.clear();
      }

      select(picked.id);
      camera.startFocusTour(origin, objectYawRadians(picked.id), {
        mode: 'inspect',
        modelCenterY: bounds.height / 2,
      });
    },
    [screenHeight, screenWidth],
  );

  useEffect(
    () => () => {
      setInteracting(false);
      stopAllVelocity();
    },
    [setInteracting, stopAllVelocity],
  );

  const doubleTapRecenter = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(2)
    .maxDuration(250)
    .maxDistance(12)
    .onEnd(handleDoubleTap);

  const singleTapFocus = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(1)
    .maxDuration(220)
    .maxDistance(12)
    .onEnd((event) => {
      handleSingleTap(event.x, event.y);
    });

  const oneFingerPan = Gesture.Pan()
    .runOnJS(true)
    .minPointers(1)
    .maxPointers(1)
    .minDistance(4)
    .onBegin(beginPan)
    .onChange((event) => {
      handlePanChange(event.changeX, event.changeY, event.x, event.y);
    })
    .onFinalize((event) => {
      endPan(event.velocityX, event.velocityY);
    });

  const twistOrbit = Gesture.Rotation()
    .runOnJS(true)
    .onBegin(beginTwist)
    .onChange((event) => {
      handleTwistChange(event.rotationChange);
    })
    .onFinalize(endTwist);

  const pinchZoom = Gesture.Pinch()
    .runOnJS(true)
    .onBegin((event) => {
      beginPinch(event.focalY);
    })
    .onChange((event) => {
      handlePinchChange(event.scale, event.focalY);
    })
    .onFinalize(endInteraction);

  const gesture = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTapRecenter, singleTapFocus),
    oneFingerPan,
    Gesture.Simultaneous(pinchZoom, twistOrbit),
  );

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.root} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
}

export const SurfaceOrbitControls = memo(SurfaceOrbitControlsComponent);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
