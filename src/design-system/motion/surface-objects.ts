import { durations } from './durations';

const approachMs = durations.fast * 3;
const launchMs = 380;
const fallMs = 820;
const revealMs = launchMs + fallMs;
const overlapMs = Math.round(approachMs * 0.32);

export const surfaceObjectMotion = {
  spawn: {
    pauseMs: 0,
    surfaceBreathMs: 0,
    materializeMs: 0,
    boundsExpandMs: durations.slow,
    approachMs,
    launchMs,
    fallMs,
    revealMs,
    overlapMs,
    cameraFocusMs: approachMs + (revealMs - overlapMs),
    focusDistanceFactor: 0.55,
    dropHeight: 1.35,
    spinTurns: 2,
  },
  inspect: {
    distanceFactor: 0.34,
    sheetScreenFraction: 0.56,
    /** Smaller lift leaves the selected object ~35px lower above the sheet. */
    screenLiftFactor: 0.18,
    rotateMs: 640,
  },
  open: { distanceFactor: 0.6 },
  stateTransitionMs: durations.base,
  removalMs: durations.fast,
  dim: { opacity: 0.1, fadeMs: durations.base },
  selection: { pulseSpeed: 3.2, pulseAmplitude: 0.08 },
  flameAnim: { spawnMs: 3_000, leaveDistanceFactor: 1.25 },
} as const;

export type SpawnPhase =
  | 'idle'
  | 'pause'
  | 'surfaceBreath'
  | 'materialize'
  | 'cameraFocus'
  | 'complete';
