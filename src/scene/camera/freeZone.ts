import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import { spacing } from '@/design-system/spacing/spacing';

/** Height of the status row (fps, sync, avatars) floating over the scene. */
export const TOP_CHROME_HEIGHT = 40;

/** `BottomSheet` never lays out shorter than this, whatever the fraction asks. */
export const SHEET_MIN_HEIGHT = 220;

export type FreeZone = {
  readonly top: number;
  readonly bottom: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerY: number;
};

export type FreeZoneInput = {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly safeAreaTop: number;
  /** Measured sheet height, when there is one. Otherwise it is predicted. */
  readonly sheetHeight?: number;
};

/**
 * Height the details sheet will take, computed instead of measured.
 *
 * Waiting for the sheet to lay out would frame the first tap of a session
 * against a guess. The sheet's height is a pure function of the screen, so the
 * camera can know it before the sheet has ever opened.
 */
export function predictedSheetHeight(
  viewportHeight: number,
  heightFraction: number = surfaceObjectMotion.inspect.sheetScreenFraction,
): number {
  return Math.max(SHEET_MIN_HEIGHT, viewportHeight * heightFraction);
}

/**
 * The band an inspected model gets: below the top chrome, above the sheet.
 *
 * This is the single definition of "free space" — the camera frames into it and
 * the debug overlay draws it, so the two can never drift apart.
 */
export function resolveFreeZone({
  viewportWidth,
  viewportHeight,
  safeAreaTop,
  sheetHeight,
}: FreeZoneInput): FreeZone {
  const top = Math.max(0, safeAreaTop) + spacing.sm + TOP_CHROME_HEIGHT;
  const bottom = viewportHeight - (sheetHeight ?? predictedSheetHeight(viewportHeight));
  const height = Math.max(0, bottom - top);

  return {
    top,
    bottom,
    height,
    centerX: viewportWidth / 2,
    centerY: top + height / 2,
  };
}
