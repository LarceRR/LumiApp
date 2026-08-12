import { create } from 'zustand';

import { cameraMotion } from '@/design-system/motion/camera';
import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';
import {
  elevationForDistance,
  MAX_ELEVATION_RAD,
  MIN_ELEVATION_RAD,
} from '@/scene/camera/cameraConfig';
import {
  type FocusTourState,
  focusTourFrame,
  focusTourTotalSeconds,
} from '@/scene/camera/focusTour';
import { lerpTarget, targetDistance } from '@/scene/camera/recenter';
import { orbitAzimuthFacing } from '@/scene/objects/core/objectFacing';
import { clamp } from '@/shared/utils/math';

export type OrbitTarget = { readonly x: number; readonly y: number; readonly z: number };

export type OrbitState = {
  readonly azimuth: number;
  readonly elevation: number;
  readonly distance: number;
  readonly target: OrbitTarget;
};

export type OrbitVelocity = { readonly azimuth: number; readonly elevation: number };
export type PanVelocity = { readonly x: number; readonly z: number };

/**
 * Where inspect wants the camera, already solved by `solveInspectFraming`.
 *
 * The store deliberately knows nothing about models, sheets or screens: it flies
 * to a pose someone measured for it.
 */
export type InspectFocusFraming = {
  readonly target: OrbitTarget;
  readonly distance: number;
  readonly elevation: number;
};

export type FocusTourOptions = {
  readonly mode?: 'spawn' | 'inspect';
  readonly framing?: InspectFocusFraming;
};

type RecenterAnimation = {
  readonly from: OrbitTarget;
  readonly to: OrbitTarget;
  readonly fromDistance: number | null;
  readonly toDistance: number | null;
  readonly fromElevation: number | null;
  readonly toElevation: number | null;
  readonly elapsedSeconds: number;
  readonly durationSeconds: number;
};

type CameraState = {
  readonly orbit: OrbitState;
  readonly orbitVelocity: OrbitVelocity;
  readonly panVelocity: PanVelocity;
  readonly mapCenter: OrbitTarget;
  readonly mapCenterCell: Cell;
  readonly recenter: RecenterAnimation | null;
  readonly focusTour: FocusTourState | null;
  /** Pose to come back to when inspect ends, captured before the first tour. */
  readonly inspectReturn: OrbitState | null;
  readonly defaultDistance: number;
  setDefaultDistance: (distance: number) => void;
  setMapCenter: (center: OrbitTarget, cell: Cell) => void;
  setTarget: (target: OrbitTarget) => void;
  frameObject: (target: OrbitTarget, faceYaw: number, distanceFactor: number) => void;
  orbitBy: (deltaAzimuth: number, deltaElevation: number) => void;
  panBy: (deltaX: number, deltaZ: number) => void;
  zoomByFactor: (scale: number) => void;
  setOrbitVelocity: (velocity: OrbitVelocity) => void;
  setPanVelocity: (velocity: PanVelocity) => void;
  stopAllVelocity: () => void;
  cancelRecenter: () => void;
  startRecenter: () => void;
  tickRecenter: (deltaSeconds: number) => void;
  startFocusTour: (focusTarget: OrbitTarget, faceYaw: number, options?: FocusTourOptions) => number;
  tickFocusTour: (deltaSeconds: number) => void;
  cancelFocusTour: () => void;
  endInspect: () => void;
  tickMomentum: (deltaSeconds: number) => void;
  reset: () => void;
};

const DEFAULT_TARGET: OrbitTarget = { x: 0, y: 0, z: 0 };
const DEFAULT_MAP_CENTER_CELL: Cell = { x: 0, y: 0 };
const ZERO_ORBIT_VELOCITY: OrbitVelocity = { azimuth: 0, elevation: 0 };
const ZERO_PAN_VELOCITY: PanVelocity = { x: 0, z: 0 };

function clampElevation(value: number): number {
  return clamp(value, MIN_ELEVATION_RAD, MAX_ELEVATION_RAD);
}

function clampDistance(distance: number, defaultDistance: number): number {
  return clamp(
    distance,
    defaultDistance * cameraMotion.minDistanceFactor,
    defaultDistance * cameraMotion.maxDistanceFactor,
  );
}

/**
 * Inspect may come closer than a pinch is allowed to: the model has to own the
 * free zone, and top-down that means getting near enough for its footprint to
 * fill a band a third of the screen tall.
 */
function clampInspectDistance(distance: number, defaultDistance: number): number {
  return clamp(
    distance,
    defaultDistance * cameraMotion.inspectMinDistanceFactor,
    defaultDistance * cameraMotion.maxDistanceFactor,
  );
}

function createInitialOrbit(defaultDistance: number, mapCenter = DEFAULT_TARGET): OrbitState {
  return {
    azimuth: 0,
    elevation: (cameraMotion.defaultElevationDeg * Math.PI) / 180,
    distance: defaultDistance,
    target: mapCenter,
  };
}

export const useCameraStore = create<CameraState>()((set, get) => ({
  defaultDistance: 10,
  orbit: createInitialOrbit(10),
  orbitVelocity: ZERO_ORBIT_VELOCITY,
  panVelocity: ZERO_PAN_VELOCITY,
  mapCenter: DEFAULT_TARGET,
  mapCenterCell: DEFAULT_MAP_CENTER_CELL,
  recenter: null,
  focusTour: null,
  inspectReturn: null,
  setDefaultDistance: (defaultDistance) =>
    set((state) => ({
      defaultDistance,
      orbit: {
        ...state.orbit,
        distance: clampDistance(
          state.orbit.distance === state.defaultDistance ? defaultDistance : state.orbit.distance,
          defaultDistance,
        ),
        elevation: elevationForDistance(
          state.orbit.distance === state.defaultDistance ? defaultDistance : state.orbit.distance,
          defaultDistance,
        ),
      },
    })),
  setMapCenter: (mapCenter, mapCenterCell) => set({ mapCenter, mapCenterCell }),
  setTarget: (target) => set((state) => ({ orbit: { ...state.orbit, target } })),
  frameObject: (target, faceYaw, distanceFactor) =>
    set((state) => {
      const distance = clampDistance(state.defaultDistance * distanceFactor, state.defaultDistance);

      return {
        recenter: null,
        focusTour: null,
        inspectReturn: null,
        orbitVelocity: ZERO_ORBIT_VELOCITY,
        panVelocity: ZERO_PAN_VELOCITY,
        orbit: {
          ...state.orbit,
          target: { ...target },
          azimuth: orbitAzimuthFacing(faceYaw),
          distance,
          elevation: elevationForDistance(distance, state.defaultDistance),
        },
      };
    }),
  orbitBy: (deltaAzimuth, deltaElevation) => {
    if (get().focusTour !== null) return;
    set((state) => ({
      recenter: null,
      orbit: {
        ...state.orbit,
        azimuth: state.orbit.azimuth + deltaAzimuth,
        elevation: clampElevation(state.orbit.elevation + deltaElevation),
      },
    }));
  },
  panBy: (deltaX, deltaZ) => {
    if (get().focusTour !== null) return;
    set((state) => ({
      recenter: null,
      orbit: {
        ...state.orbit,
        target: {
          x: state.orbit.target.x + deltaX,
          y: state.orbit.target.y,
          z: state.orbit.target.z + deltaZ,
        },
      },
    }));
  },
  zoomByFactor: (scale) => {
    if (get().focusTour !== null || !Number.isFinite(scale) || scale <= 0) return;
    const { defaultDistance, orbit } = get();
    const distance = clampDistance(
      orbit.distance * scale ** cameraMotion.zoomSensitivity,
      defaultDistance,
    );
    set({
      orbit: { ...orbit, distance, elevation: elevationForDistance(distance, defaultDistance) },
    });
  },
  setOrbitVelocity: (orbitVelocity) => set({ orbitVelocity }),
  setPanVelocity: (panVelocity) => set({ panVelocity }),
  stopAllVelocity: () =>
    set({ orbitVelocity: ZERO_ORBIT_VELOCITY, panVelocity: ZERO_PAN_VELOCITY }),
  cancelRecenter: () => set({ recenter: null }),
  startRecenter: () => {
    if (get().focusTour !== null) return;
    const { orbit, mapCenter } = get();
    if (targetDistance(orbit.target, mapCenter) <= cameraMotion.recenterSnapDistance) return;
    get().stopAllVelocity();
    set({
      recenter: {
        from: { ...orbit.target },
        to: { ...mapCenter },
        fromDistance: null,
        toDistance: null,
        fromElevation: null,
        toElevation: null,
        elapsedSeconds: 0,
        durationSeconds: cameraMotion.recenterDurationMs / 1000,
      },
    });
  },
  tickRecenter: (deltaSeconds) => {
    if (get().focusTour !== null) return;
    const { recenter, orbit, defaultDistance } = get();
    if (!recenter) return;
    const elapsedSeconds = recenter.elapsedSeconds + deltaSeconds;
    const progress = elapsedSeconds / recenter.durationSeconds;
    const distance =
      recenter.fromDistance !== null && recenter.toDistance !== null
        ? clampDistance(
            recenter.fromDistance + (recenter.toDistance - recenter.fromDistance) * progress,
            defaultDistance,
          )
        : orbit.distance;
    // Elevation follows the animation, not the distance: inspect can hold an
    // angle the zoom curve would never pick, and coming back has to undo that
    // smoothly instead of snapping on the first frame.
    const elevation =
      recenter.fromElevation !== null && recenter.toElevation !== null
        ? clampElevation(
            recenter.fromElevation +
              (recenter.toElevation - recenter.fromElevation) * Math.min(1, Math.max(0, progress)),
          )
        : orbit.elevation;

    if (progress >= 1)
      set({
        recenter: null,
        orbit: { ...orbit, target: { ...recenter.to }, distance, elevation },
      });
    else
      set({
        recenter: { ...recenter, elapsedSeconds },
        orbit: {
          ...orbit,
          target: lerpTarget(recenter.from, recenter.to, progress),
          distance,
          elevation,
        },
      });
  },
  startFocusTour: (focusTarget, faceYaw, options) => {
    const { orbit, defaultDistance, inspectReturn } = get();
    const { spawn, inspect } = surfaceObjectMotion;
    const isInspect = options?.mode === 'inspect';
    const framing = isInspect ? (options?.framing ?? null) : null;
    const focusDistance =
      framing === null
        ? clampDistance(
            defaultDistance * (isInspect ? inspect.distanceFactor : spawn.focusDistanceFactor),
            defaultDistance,
          )
        : clampInspectDistance(framing.distance, defaultDistance);
    const target = framing === null ? { ...focusTarget } : { ...framing.target };
    const focusAzimuth = isInspect ? orbit.azimuth : orbitAzimuthFacing(faceYaw);
    const focusElevation =
      framing === null
        ? elevationForDistance(focusDistance, defaultDistance)
        : clampElevation(framing.elevation);
    const tour: FocusTourState = {
      focusTarget: target,
      savedTarget: { ...orbit.target },
      savedDistance: orbit.distance,
      savedAzimuth: orbit.azimuth,
      savedElevation: orbit.elevation,
      focusDistance,
      faceYaw,
      focusAzimuth,
      focusElevation,
      elapsedSeconds: 0,
      approachSeconds: spawn.approachMs / 1000,
      revealSeconds: isInspect ? 0 : spawn.revealMs / 1000,
      overlapSeconds: isInspect ? 0 : spawn.overlapMs / 1000,
      launchSeconds: isInspect ? 0 : spawn.launchMs / 1000,
      fallSeconds: isInspect ? 0 : spawn.fallMs / 1000,
      spinTurns: isInspect ? 0 : spawn.spinTurns,
    };
    get().stopAllVelocity();
    set({
      recenter: null,
      focusTour: tour,
      // Tapping a second object mid-inspect must not overwrite where we came from.
      inspectReturn: isInspect ? (inspectReturn ?? { ...orbit }) : null,
    });

    return focusTourTotalSeconds(tour);
  },
  tickFocusTour: (deltaSeconds) => {
    const { focusTour, orbit, defaultDistance } = get();
    if (!focusTour) return;
    const next = { ...focusTour, elapsedSeconds: focusTour.elapsedSeconds + deltaSeconds };
    const frame = focusTourFrame(next);

    if (frame.done)
      set({
        focusTour: null,
        orbit: {
          ...orbit,
          target: { ...focusTour.focusTarget },
          distance: clampInspectDistance(focusTour.focusDistance, defaultDistance),
          elevation: clampElevation(focusTour.focusElevation),
          azimuth: focusTour.focusAzimuth,
        },
      });
    else
      set({
        focusTour: next,
        orbit: {
          ...orbit,
          target: frame.target,
          distance: clampInspectDistance(frame.distance, defaultDistance),
          elevation: clampElevation(frame.elevation),
          azimuth: frame.azimuth,
        },
      });
  },
  cancelFocusTour: () => set({ focusTour: null }),
  endInspect: () => {
    const { orbit, defaultDistance, inspectReturn } = get();
    // Back to the zoom and angle the user was looking from — the inspected cell
    // stays under the camera, so closing the sheet never teleports the surface.
    const home = {
      target: { x: orbit.target.x, y: 0, z: orbit.target.z },
      distance: inspectReturn?.distance ?? defaultDistance,
      elevation: inspectReturn?.elevation ?? elevationForDistance(defaultDistance, defaultDistance),
    };

    if (
      orbit.target.y === home.target.y &&
      orbit.distance === home.distance &&
      orbit.elevation === home.elevation
    ) {
      set({ focusTour: null, inspectReturn: null });

      return;
    }

    set({
      focusTour: null,
      inspectReturn: null,
      orbitVelocity: ZERO_ORBIT_VELOCITY,
      panVelocity: ZERO_PAN_VELOCITY,
      recenter: {
        from: { ...orbit.target },
        to: home.target,
        fromDistance: orbit.distance,
        toDistance: home.distance,
        fromElevation: orbit.elevation,
        toElevation: home.elevation,
        elapsedSeconds: 0,
        durationSeconds: cameraMotion.recenterDurationMs / 1000,
      },
    });
  },
  tickMomentum: (deltaSeconds) => {
    if (get().recenter !== null || get().focusTour !== null) return;
    const safeDelta = Math.min(deltaSeconds, 0.05);
    const { orbitVelocity, panVelocity, orbit } = get();
    const orbitDead =
      Math.abs(orbitVelocity.azimuth) < cameraMotion.orbitMinVelocity &&
      Math.abs(orbitVelocity.elevation) < cameraMotion.orbitMinVelocity;
    const panDead =
      Math.abs(panVelocity.x) < cameraMotion.panMinVelocity &&
      Math.abs(panVelocity.z) < cameraMotion.panMinVelocity;

    if (orbitDead && panDead) {
      if (
        orbitVelocity.azimuth !== 0 ||
        orbitVelocity.elevation !== 0 ||
        panVelocity.x !== 0 ||
        panVelocity.z !== 0
      )
        set({ orbitVelocity: ZERO_ORBIT_VELOCITY, panVelocity: ZERO_PAN_VELOCITY });

      return;
    }

    const orbitDecay = Math.exp(-cameraMotion.orbitDecay * safeDelta);
    const panDecay = Math.exp(-cameraMotion.panDecay * safeDelta);

    set({
      orbit: {
        ...orbit,
        azimuth: orbit.azimuth + (orbitDead ? 0 : orbitVelocity.azimuth * safeDelta),
        // Momentum never touches the distance, so it must not re-derive the angle
        // either — that used to yank a held angle back onto the zoom curve.
        elevation: orbit.elevation,
        target: {
          x: orbit.target.x + (panDead ? 0 : panVelocity.x * safeDelta),
          y: orbit.target.y,
          z: orbit.target.z + (panDead ? 0 : panVelocity.z * safeDelta),
        },
      },
      orbitVelocity: orbitDead
        ? ZERO_ORBIT_VELOCITY
        : {
            azimuth: orbitVelocity.azimuth * orbitDecay,
            elevation: orbitVelocity.elevation * orbitDecay,
          },
      panVelocity: panDead
        ? ZERO_PAN_VELOCITY
        : { x: panVelocity.x * panDecay, z: panVelocity.z * panDecay },
    });
  },
  reset: () => {
    const { defaultDistance, mapCenter } = get();
    set({
      orbit: createInitialOrbit(defaultDistance, mapCenter),
      orbitVelocity: ZERO_ORBIT_VELOCITY,
      panVelocity: ZERO_PAN_VELOCITY,
      recenter: null,
      focusTour: null,
      inspectReturn: null,
    });
  },
}));

export const selectOrbit = (state: CameraState): OrbitState => state.orbit;
export const selectMapCenterCell = (state: CameraState): Cell => state.mapCenterCell;
export const selectFocusTour = (state: CameraState): FocusTourState | null => state.focusTour;
