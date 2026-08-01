import { durations } from './durations';

const approachMs = durations.fast * 3;
/** Pop up off the cell once the camera is nearly there. */
const launchMs = 380;
/** Soft fall after the apex — lands without bounce. */
const fallMs = 820;
const revealMs = launchMs + fallMs;
/**
 * How early (before approach ends) the object starts launching —
 * so the action feels underway as the camera finishes arriving.
 */
const overlapMs = Math.round(approachMs * 0.32);

/**
 * Spawn reveal shaped like a case-drop item:
 * on the ground → launch (near end of camera approach) → soft fall → settle.
 * Camera stays at the reveal framing (no fly-back).
 */
export const surfaceObjectMotion = {
  spawn: {
    pauseMs: 0,
    surfaceBreathMs: 0,
    materializeMs: 0,
    boundsExpandMs: durations.slow,
    /**
     * Camera flies to the new object (~3× the old fast approach).
     * Eased with cubic-bezier(0.65, 0, 0.35, 1).
     */
    approachMs,
    launchMs,
    fallMs,
    revealMs,
    overlapMs,
    cameraFocusMs: approachMs + (revealMs - overlapMs),
    focusDistanceFactor: 0.55,
    /** World-unit apex height of the launch. */
    dropHeight: 1.35,
    /** Full yaw revolutions during launch → fall. */
    spinTurns: 2,
  },

  stateTransitionMs: durations.base,
  removalMs: durations.fast,

  /**
   * Other visible fires while the camera tours a new one.
   * Opacity is damped in/out — never snapped — so focus shifts feel soft.
   */
  dim: {
    opacity: 0.1,
    fadeMs: durations.base,
  },

  selection: {
    pulseSpeed: 3.2,
    pulseAmplitude: 0.08,
  },

  /**
   * Flame shader / light flicker. Idle fires stay frozen;
   * spawn plays a finite clip; inspect focus loops until zoom-out.
   */
  flameAnim: {
    /** Finite play window when a new fire is created. */
    spawnMs: 3_000,
    /** Clear inspect focus once distance exceeds focusDistance × this. */
    leaveDistanceFactor: 1.25,
  },
} as const;

export type SpawnPhase =
  | 'idle'
  | 'pause'
  | 'surfaceBreath'
  | 'materialize'
  | 'cameraFocus'
  | 'complete';
