import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';

/**
 * Whether this fire should advance its flame shader / light flicker.
 * - Spawn: finite window (`flameAnim.spawnMs`) after materialize.
 * - Inspect focus: infinite while selected and camera still near focus distance.
 */
export function fireAnimationPlaying(input: {
  readonly isSpawning: boolean;
  readonly spawnElapsedMs: number;
  readonly isSelected: boolean;
  readonly focusTourActive: boolean;
  readonly cameraDistance: number;
  readonly focusDistance: number;
}): boolean {
  const { spawnMs, leaveDistanceFactor } = surfaceObjectMotion.flameAnim;

  if (input.isSpawning || input.spawnElapsedMs < spawnMs) {
    return true;
  }

  if (!input.isSelected) {
    return false;
  }

  if (input.focusTourActive) {
    return true;
  }

  return input.cameraDistance <= input.focusDistance * leaveDistanceFactor;
}

/** Target opacity for a fire given spawn / inspect focus state. */
export function spawnFocusOpacityTarget(isActiveFocus: boolean, dimOthers: boolean): number {
  if (dimOthers && !isActiveFocus) {
    return surfaceObjectMotion.dim.opacity;
  }

  return 1;
}

/** True when the camera has left the inspect framing enough to end focus. */
export function fireFocusLostByZoom(
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
