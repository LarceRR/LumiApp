import { describe, expect, it } from 'vitest';

import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import { spacing } from '@/design-system/spacing/spacing';

import { predictedSheetHeight, resolveFreeZone, TOP_CHROME_HEIGHT } from './freeZone';

describe('resolveFreeZone', () => {
  it('spans the gap between the top chrome and the sheet', () => {
    const zone = resolveFreeZone({
      viewportWidth: 390,
      viewportHeight: 844,
      safeAreaTop: 47,
    });

    expect(zone.top).toBe(47 + spacing.sm + TOP_CHROME_HEIGHT);
    expect(zone.bottom).toBeCloseTo(844 - 844 * surfaceObjectMotion.inspect.sheetScreenFraction);
    expect(zone.height).toBeCloseTo(zone.bottom - zone.top);
    expect(zone.centerY).toBeCloseTo(zone.top + zone.height / 2);
  });

  it('prefers a measured sheet height when there is one', () => {
    const zone = resolveFreeZone({
      viewportWidth: 390,
      viewportHeight: 844,
      safeAreaTop: 47,
      sheetHeight: 500,
    });

    expect(zone.bottom).toBe(344);
  });

  it('never reports a negative band on a short screen', () => {
    const zone = resolveFreeZone({ viewportWidth: 320, viewportHeight: 240, safeAreaTop: 20 });

    expect(predictedSheetHeight(240)).toBe(220);
    expect(zone.height).toBe(0);
  });
});
