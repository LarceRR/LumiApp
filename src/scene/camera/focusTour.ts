import type { OrbitTarget } from '@/scene/stores/cameraStore';

import { easeInOutCubicBezier, easeOutCubicBezier } from './easing';

export type FocusTourPhase = 'approach' | 'reveal';

export type FocusTourState = {
  readonly focusTarget: OrbitTarget;
  readonly savedTarget: OrbitTarget;
  readonly savedDistance: number;
  readonly savedAzimuth: number;
  readonly focusDistance: number;
  /** Resting yaw of the object (before / after spawn spin). */
  readonly faceYaw: number;
  /** Orbit azimuth that puts the camera in front of the object's face. */
  readonly focusAzimuth: number;
  readonly elapsedSeconds: number;
  readonly approachSeconds: number;
  /** Launch + fall. */
  readonly revealSeconds: number;
  /** Reveal starts this many seconds before approach ends. */
  readonly overlapSeconds: number;
  readonly launchSeconds: number;
  readonly fallSeconds: number;
  readonly spinTurns: number;
};

/** Camera hold after approach equals remaining reveal after the overlap. */
export function focusTourHoldSeconds(tour: FocusTourState): number {
  return Math.max(0, tour.revealSeconds - tour.overlapSeconds);
}

export function focusTourTotalSeconds(tour: FocusTourState): number {
  return tour.approachSeconds + focusTourHoldSeconds(tour);
}

export function focusTourPhase(tour: FocusTourState): FocusTourPhase {
  if (tour.elapsedSeconds < tour.approachSeconds) {
    return 'approach';
  }

  return 'reveal';
}

/** When the object leaves the ground (near the end of camera approach). */
export function focusTourRevealStart(tour: FocusTourState): number {
  return Math.max(0, tour.approachSeconds - tour.overlapSeconds);
}

/** Seconds into launch→fall. Negative while still grounded. */
export function focusTourRevealElapsed(tour: FocusTourState): number {
  return tour.elapsedSeconds - focusTourRevealStart(tour);
}

/**
 * Case-drop pose: grounded → launch → soft fall → settle.
 * Spin is an integer number of turns so the face ends where it started (toward camera).
 */
export function focusTourObjectPose(tour: FocusTourState): {
  readonly spinRadians: number;
  readonly heightFactor: number;
} {
  const local = focusTourRevealElapsed(tour);

  if (local <= 0) {
    return { spinRadians: 0, heightFactor: 0 };
  }

  const launchEnd = tour.launchSeconds;
  const fallEnd = launchEnd + tour.fallSeconds;

  let heightFactor: number;

  if (local < launchEnd) {
    heightFactor = easeOutCubicBezier(local / Math.max(launchEnd, 1e-6));
  } else if (local < fallEnd) {
    const fallT = easeOutCubicBezier((local - launchEnd) / Math.max(tour.fallSeconds, 1e-6));
    heightFactor = 1 - fallT;
  } else {
    heightFactor = 0;
  }

  const spinWindow = launchEnd + tour.fallSeconds;
  const spinT = Math.min(1, local / Math.max(spinWindow, 1e-6));
  const spinRadians = easeInOutCubicBezier(spinT) * tour.spinTurns * Math.PI * 2;

  return { spinRadians, heightFactor };
}

export function focusTourFrame(tour: FocusTourState): {
  readonly target: OrbitTarget;
  readonly distance: number;
  readonly azimuth: number;
  readonly done: boolean;
} {
  const total = focusTourTotalSeconds(tour);

  if (tour.elapsedSeconds >= total) {
    return {
      target: tour.focusTarget,
      distance: tour.focusDistance,
      azimuth: tour.focusAzimuth,
      done: true,
    };
  }

  const phase = focusTourPhase(tour);

  if (phase === 'approach') {
    const t = easeInOutCubicBezier(tour.elapsedSeconds / Math.max(tour.approachSeconds, 1e-6));

    return {
      target: lerpOrbit(tour.savedTarget, tour.focusTarget, t),
      distance: tour.savedDistance + (tour.focusDistance - tour.savedDistance) * t,
      azimuth: lerpAngle(tour.savedAzimuth, tour.focusAzimuth, t),
      done: false,
    };
  }

  // Camera holds still in front of the face — the object spins on its own.
  return {
    target: tour.focusTarget,
    distance: tour.focusDistance,
    azimuth: tour.focusAzimuth,
    done: false,
  };
}

/** Shortest-path angle lerp. */
export function lerpAngle(from: number, to: number, t: number): number {
  let delta = to - from;
  while (delta > Math.PI) {
    delta -= Math.PI * 2;
  }
  while (delta < -Math.PI) {
    delta += Math.PI * 2;
  }

  return from + delta * t;
}

function lerpOrbit(from: OrbitTarget, to: OrbitTarget, t: number): OrbitTarget {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t,
  };
}
