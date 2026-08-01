import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';

import { isLostInFog } from './fogVisibility';

export type AnimationGateInput = {
  /** 0 = clear, 1 = fully dissolved in the scene fog. */
  readonly fogFactor: number;
  readonly reduceMotion: boolean;
};

/**
 * Whether an object should advance its simulation this frame.
 *
 * Two reasons to freeze: the user asked for less motion, or the object has
 * drifted past the fog volume — nothing left on screen to animate.
 */
export function objectAnimationPlaying(input: AnimationGateInput): boolean {
  if (input.reduceMotion) {
    return false;
  }

  return !isLostInFog(input.fogFactor);
}

/** Target opacity for an object given spawn / inspect focus state. */
export function objectOpacityTarget(isActiveFocus: boolean, dimOthers: boolean): number {
  if (dimOthers && !isActiveFocus) {
    return surfaceObjectMotion.dim.opacity;
  }

  return 1;
}

/** True when the camera has left the inspect framing enough to end focus. */
export function focusLostByZoom(
  isSelected: boolean,
  focusTourActive: boolean,
  cameraDistance: number,
  focusDistance: number,
): boolean {
  if (!isSelected || focusTourActive) {
    return false;
  }

  const { leaveDistanceFactor } = surfaceObjectMotion.flameAnim;

  return cameraDistance > focusDistance * leaveDistanceFactor;
}
