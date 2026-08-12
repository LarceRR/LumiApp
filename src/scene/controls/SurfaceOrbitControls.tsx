import { memo, type ReactElement, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { cameraMotion } from '@/design-system/motion/camera';
import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import { knownKinds } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { panDeltaFromScreen, worldUnitsPerPixel } from '@/scene/camera/cameraConfig';
import { getModelScreenBounds } from '@/scene/objects/core/modelScreenBounds';
import { objectYawRadians } from '@/scene/objects/core/objectYaw';
import { groundHitFromScreen, pickNearestObject } from '@/scene/objects/core/pickObjectAtScreen';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { useInspectStore } from '@/scene/stores/inspectStore';
import { useSceneStore } from '@/scene/stores/sceneStore';
import { cellToWorld } from '@/scene/surface/cellToWorld';
export type SurfaceOrbitControlsProps = { readonly children: ReactElement };
type Sample = { readonly x: number; readonly z: number; readonly at: number };
const WINDOW_MS = 100;
function velocity(samples: readonly Sample[]): { x: number; z: number } {
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (!first || !last || last.at <= first.at) return { x: 0, z: 0 };
  const seconds = (last.at - first.at) / 1000;
  return {
    x: (samples.reduce((sum, item) => sum + item.x, 0) / seconds) * cameraMotion.panInertiaGain,
    z: (samples.reduce((sum, item) => sum + item.z, 0) / seconds) * cameraMotion.panInertiaGain,
  };
}
function SurfaceOrbitControlsComponent({ children }: SurfaceOrbitControlsProps): ReactElement {
  const { width, height } = useWindowDimensions();
  const panBy = useCameraStore((state) => state.panBy);
  const orbitBy = useCameraStore((state) => state.orbitBy);
  const zoomByFactor = useCameraStore((state) => state.zoomByFactor);
  const setOrbitVelocity = useCameraStore((state) => state.setOrbitVelocity);
  const setPanVelocity = useCameraStore((state) => state.setPanVelocity);
  const stopAllVelocity = useCameraStore((state) => state.stopAllVelocity);
  const cancelRecenter = useCameraStore((state) => state.cancelRecenter);
  const startFocusTour = useCameraStore((state) => state.startFocusTour);
  const setInteracting = useSceneStore((state) => state.setInteracting);
  const samples = useRef<Sample[]>([]);
  const lastScale = useRef(1);
  const rotationSamples = useRef<Sample[]>([]);
  const begin = useCallback(() => {
    cancelRecenter();
    stopAllVelocity();
    setInteracting(true);
  }, [cancelRecenter, setInteracting, stopAllVelocity]);
  const end = useCallback(() => setInteracting(false), [setInteracting]);
  const onPan = useCallback(
    (dx: number, dy: number, x: number, y: number) => {
      const orbit = useCameraStore.getState().orbit;
      const prev = groundHitFromScreen(x - dx, y - dy, width, height, orbit);
      const next = groundHitFromScreen(x, y, width, height, orbit);
      const delta =
        prev && next
          ? { x: prev.x - next.x, z: prev.z - next.z }
          : panDeltaFromScreen(
              dx,
              dy,
              orbit.azimuth,
              orbit.elevation,
              worldUnitsPerPixel(orbit.distance, height),
            );
      const now = Date.now();
      samples.current = [
        ...samples.current.filter((item) => item.at >= now - WINDOW_MS),
        { ...delta, at: now },
      ];
      panBy(delta.x, delta.z);
    },
    [height, panBy, width],
  );
  const finishPan = useCallback(
    (vx = 0, vy = 0) => {
      const orbit = useCameraStore.getState().orbit;
      const fallback = panDeltaFromScreen(
        vx,
        vy,
        orbit.azimuth,
        orbit.elevation,
        worldUnitsPerPixel(orbit.distance, height),
      );
      const v = samples.current.length > 1 ? velocity(samples.current) : fallback;
      setPanVelocity({
        x: Math.max(-cameraMotion.panMaxVelocity, Math.min(cameraMotion.panMaxVelocity, v.x)),
        z: Math.max(-cameraMotion.panMaxVelocity, Math.min(cameraMotion.panMaxVelocity, v.z)),
      });
      samples.current = [];
      end();
    },
    [end, height, setPanVelocity],
  );
  const onPinch = useCallback(
    (scale: number) => {
      if (lastScale.current > 0) zoomByFactor(lastScale.current / scale);
      lastScale.current = scale;
    },
    [zoomByFactor],
  );
  const onRotation = useCallback(
    (rotationChange: number) => {
      const delta = rotationChange * cameraMotion.rotationGain;
      orbitBy(delta, 0);
      const now = Date.now();
      rotationSamples.current = [
        ...rotationSamples.current.filter((item) => item.at >= now - WINDOW_MS),
        { x: delta, z: 0, at: now },
      ];
    },
    [orbitBy],
  );
  const finishRotation = useCallback(() => {
    const v = velocity(rotationSamples.current);
    setOrbitVelocity({
      azimuth: Math.max(
        -cameraMotion.orbitMaxVelocity,
        Math.min(cameraMotion.orbitMaxVelocity, v.x),
      ),
      elevation: 0,
    });
    rotationSamples.current = [];
    end();
  }, [end, setOrbitVelocity]);
  const focusLastFire = useCallback(() => {
    const { selectedId, byId } = useSurfaceObjectsStore.getState();
    const selected = selectedId ? byId[selectedId] : undefined;
    const fire =
      selected?.kind === knownKinds.fire
        ? selected
        : Object.values(byId).find((item) => item.kind === knownKinds.fire);
    if (!fire) return;
    const inspect = useInspectStore.getState();
    const bounds = getModelScreenBounds(fire.id, { width, height });
    const sheetHeight =
      inspect.sheetHeight ?? height * surfaceObjectMotion.inspect.sheetScreenFraction;
    startFocusTour(cellToWorld(fire.cell), objectYawRadians(fire.id), {
      mode: 'inspect',
      framing: bounds
        ? {
            screenHeight: height,
            sheetTopPx: Math.max(0, height - sheetHeight),
            centerLiftPx: bounds.centerLiftPx,
            measuredAtDistance: useCameraStore.getState().orbit.distance,
          }
        : undefined,
    });
  }, [height, startFocusTour, width]);
  const onTap = useCallback(
    (x: number, y: number) => {
      const camera = useCameraStore.getState();
      if (camera.focusTour) return;
      const hit = groundHitFromScreen(x, y, width, height, camera.orbit);
      if (!hit) return;
      const { order, byId, select } = useSurfaceObjectsStore.getState();
      const fires = order.flatMap((id) => {
        const object = byId[id];
        return object?.kind === knownKinds.fire ? [{ id: object.id, cell: object.cell }] : [];
      });
      const picked = pickNearestObject(hit, fires);
      if (!picked) {
        useInspectStore.getState().clearHitbox();
        return;
      }
      select(picked.id);
      const bounds = getModelScreenBounds(picked.id, { width, height });
      useInspectStore.getState().setHitbox(bounds);
      const sheet =
        useInspectStore.getState().sheetHeight ??
        height * surfaceObjectMotion.inspect.sheetScreenFraction;
      startFocusTour(cellToWorld(picked.cell), objectYawRadians(picked.id), {
        mode: 'inspect',
        framing: bounds
          ? {
              screenHeight: height,
              sheetTopPx: Math.max(0, height - sheet),
              centerLiftPx: bounds.centerLiftPx,
              measuredAtDistance: camera.orbit.distance,
            }
          : undefined,
      });
    },
    [height, startFocusTour, width],
  );
  useEffect(
    () => () => {
      setInteracting(false);
      stopAllVelocity();
    },
    [setInteracting, stopAllVelocity],
  );
  const pan = Gesture.Pan()
    .runOnJS(true)
    .minPointers(1)
    .maxPointers(1)
    .minDistance(4)
    .onBegin(begin)
    .onChange((event) => onPan(event.changeX, event.changeY, event.x, event.y))
    .onFinalize((event) => finishPan(event.velocityX, event.velocityY));
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onBegin(() => {
      lastScale.current = 1;
      begin();
    })
    .onChange((event) => onPinch(event.scale))
    .onFinalize(end);
  const rotation = Gesture.Rotation()
    .runOnJS(true)
    .onBegin(() => {
      rotationSamples.current = [];
      begin();
    })
    .onChange((event) => onRotation(event.rotationChange))
    .onFinalize(finishRotation);
  const doubleTap = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(2)
    .maxDuration(250)
    .maxDistance(12)
    .onEnd(focusLastFire);
  const singleTap = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(1)
    .maxDuration(220)
    .maxDistance(12)
    .onEnd((event) => onTap(event.x, event.y));
  const gesture = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTap, singleTap),
    pan,
    Gesture.Simultaneous(pinch, rotation),
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
const styles = StyleSheet.create({ root: { flex: 1 } });
