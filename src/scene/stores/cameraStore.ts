import { create } from 'zustand';

import { cameraMotion } from '@/design-system/motion/camera';
import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';
import {
  type FocusTourState,
  focusTourFrame,
  focusTourTotalSeconds,
} from '@/scene/camera/focusTour';
import { lerpTarget, targetDistance } from '@/scene/camera/recenter';
import { orbitAzimuthFacing } from '@/scene/objects/core/objectFacing';

export type OrbitTarget = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
};

export type OrbitState = {
  readonly azimuth: number;
  readonly elevation: number;
  readonly distance: number;
  readonly target: OrbitTarget;
};

export type OrbitVelocity = {
  readonly azimuth: number;
  readonly elevation: number;
};

export type PanVelocity = {
  readonly x: number;
  readonly z: number;
};

type RecenterAnimation = {
  readonly from: OrbitTarget;
  readonly to: OrbitTarget;
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
  readonly defaultDistance: number;
  setDefaultDistance: (distance: number) => void;
  setMapCenter: (center: OrbitTarget, cell: Cell) => void;
  setTarget: (target: OrbitTarget) => void;
  orbitBy: (deltaAzimuth: number, deltaElevation: number) => void;
  panBy: (deltaX: number, deltaZ: number) => void;
  zoomByFactor: (scale: number) => void;
  setOrbitVelocity: (velocity: OrbitVelocity) => void;
  setPanVelocity: (velocity: PanVelocity) => void;
  stopAllVelocity: () => void;
  cancelRecenter: () => void;
  startRecenter: () => void;
  tickRecenter: (deltaSeconds: number) => void;
  startFocusTour: (
    focusTarget: OrbitTarget,
    faceYaw: number,
    options?: { readonly mode?: 'spawn' | 'inspect' },
  ) => number;
  tickFocusTour: (deltaSeconds: number) => void;
  cancelFocusTour: () => void;
  tickMomentum: (deltaSeconds: number) => void;
  reset: () => void;
};

const DEFAULT_TARGET: OrbitTarget = { x: 0, y: 0, z: 0 };
const DEFAULT_MAP_CENTER_CELL: Cell = { x: 0, y: 0 };
const ZERO_ORBIT_VELOCITY: OrbitVelocity = { azimuth: 0, elevation: 0 };
const ZERO_PAN_VELOCITY: PanVelocity = { x: 0, z: 0 };

function clampElevation(elevation: number): number {
  const min = (cameraMotion.minElevationDeg * Math.PI) / 180;
  const max = (cameraMotion.maxElevationDeg * Math.PI) / 180;
  return Math.min(max, Math.max(min, elevation));
}

function clampDistance(distance: number, defaultDistance: number): number {
  const min = defaultDistance * cameraMotion.minDistanceFactor;
  const max = defaultDistance * cameraMotion.maxDistanceFactor;
  return Math.min(max, Math.max(min, distance));
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
  setDefaultDistance: (defaultDistance) => {
    set((state) => ({
      defaultDistance,
      orbit: {
        ...state.orbit,
        distance: clampDistance(
          state.orbit.distance === state.defaultDistance ? defaultDistance : state.orbit.distance,
          defaultDistance,
        ),
      },
    }));
  },
  setMapCenter: (center, cell) => {
    set({ mapCenter: center, mapCenterCell: cell });
  },
  setTarget: (target) => {
    set((state) => ({
      orbit: {
        ...state.orbit,
        target,
      },
    }));
  },
  orbitBy: (deltaAzimuth, deltaElevation) => {
    if (get().focusTour !== null) {
      return;
    }

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
    if (get().focusTour !== null) {
      return;
    }

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
    if (get().focusTour !== null) {
      return;
    }

    if (!Number.isFinite(scale) || scale <= 0) {
      return;
    }

    const { defaultDistance, orbit } = get();
    const powered = scale ** cameraMotion.zoomSensitivity;

    set({
      orbit: {
        ...orbit,
        distance: clampDistance(orbit.distance * powered, defaultDistance),
      },
    });
  },
  setOrbitVelocity: (orbitVelocity) => {
    set({ orbitVelocity });
  },
  setPanVelocity: (panVelocity) => {
    set({ panVelocity });
  },
  stopAllVelocity: () => {
    set({ orbitVelocity: ZERO_ORBIT_VELOCITY, panVelocity: ZERO_PAN_VELOCITY });
  },
  cancelRecenter: () => {
    set({ recenter: null });
  },
  startRecenter: () => {
    if (get().focusTour !== null) {
      return;
    }

    const { orbit, mapCenter } = get();

    if (targetDistance(orbit.target, mapCenter) <= cameraMotion.recenterSnapDistance) {
      return;
    }

    get().stopAllVelocity();
    set({
      recenter: {
        from: { ...orbit.target },
        to: { ...mapCenter },
        elapsedSeconds: 0,
        durationSeconds: cameraMotion.recenterDurationMs / 1000,
      },
    });
  },
  tickRecenter: (deltaSeconds) => {
    if (get().focusTour !== null) {
      return;
    }

    const { recenter, orbit } = get();

    if (recenter === null) {
      return;
    }

    const elapsedSeconds = recenter.elapsedSeconds + deltaSeconds;
    const progress = elapsedSeconds / recenter.durationSeconds;

    if (progress >= 1) {
      set({
        recenter: null,
        orbit: {
          ...orbit,
          target: { ...recenter.to },
        },
      });

      return;
    }

    set({
      recenter: {
        ...recenter,
        elapsedSeconds,
      },
      orbit: {
        ...orbit,
        target: lerpTarget(recenter.from, recenter.to, progress),
      },
    });
  },
  startFocusTour: (focusTarget, faceYaw, options) => {
    const { orbit, defaultDistance } = get();
    const { spawn } = surfaceObjectMotion;
    const inspect = options?.mode === 'inspect';
    // Radially symmetric objects — azimuth from yaw still uses local +X as the
    // facing reference, so framing stays deterministic.
    const focusAzimuth = orbitAzimuthFacing(faceYaw);
    const tour: FocusTourState = {
      focusTarget: { ...focusTarget },
      savedTarget: { ...orbit.target },
      savedDistance: orbit.distance,
      savedAzimuth: orbit.azimuth,
      focusDistance: clampDistance(defaultDistance * spawn.focusDistanceFactor, defaultDistance),
      faceYaw,
      focusAzimuth,
      elapsedSeconds: 0,
      approachSeconds: spawn.approachMs / 1000,
      revealSeconds: inspect ? 0 : spawn.revealMs / 1000,
      overlapSeconds: inspect ? 0 : spawn.overlapMs / 1000,
      launchSeconds: inspect ? 0 : spawn.launchMs / 1000,
      fallSeconds: inspect ? 0 : spawn.fallMs / 1000,
      spinTurns: inspect ? 0 : spawn.spinTurns,
    };

    get().stopAllVelocity();
    set({ recenter: null, focusTour: tour });

    return focusTourTotalSeconds(tour);
  },
  tickFocusTour: (deltaSeconds) => {
    const { focusTour, orbit, defaultDistance } = get();

    if (focusTour === null) {
      return;
    }

    const next: FocusTourState = {
      ...focusTour,
      elapsedSeconds: focusTour.elapsedSeconds + deltaSeconds,
    };
    const frame = focusTourFrame(next);

    if (frame.done) {
      set({
        focusTour: null,
        orbit: {
          ...orbit,
          target: { ...focusTour.focusTarget },
          distance: clampDistance(focusTour.focusDistance, defaultDistance),
          azimuth: focusTour.focusAzimuth,
        },
      });

      return;
    }

    set({
      focusTour: next,
      orbit: {
        ...orbit,
        target: frame.target,
        distance: clampDistance(frame.distance, defaultDistance),
        azimuth: frame.azimuth,
      },
    });
  },
  cancelFocusTour: () => {
    set({ focusTour: null });
  },
  tickMomentum: (deltaSeconds) => {
    if (get().recenter !== null || get().focusTour !== null) {
      return;
    }

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
      ) {
        set({ orbitVelocity: ZERO_ORBIT_VELOCITY, panVelocity: ZERO_PAN_VELOCITY });
      }

      return;
    }

    const orbitDecay = Math.exp(-cameraMotion.orbitDecay * safeDelta);
    const panDecay = Math.exp(-cameraMotion.panDecay * safeDelta);

    set({
      orbit: {
        ...orbit,
        azimuth: orbit.azimuth + (orbitDead ? 0 : orbitVelocity.azimuth * safeDelta),
        elevation: clampElevation(
          orbit.elevation + (orbitDead ? 0 : orbitVelocity.elevation * safeDelta),
        ),
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
        : {
            x: panVelocity.x * panDecay,
            z: panVelocity.z * panDecay,
          },
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
    });
  },
}));

export const selectOrbit = (state: CameraState): OrbitState => state.orbit;
export const selectMapCenterCell = (state: CameraState): Cell => state.mapCenterCell;
export const selectFocusTour = (state: CameraState): FocusTourState | null => state.focusTour;
