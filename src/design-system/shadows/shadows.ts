import { Platform, type ViewStyle } from 'react-native';

import { alpha, palette, withAlpha } from '../colors/palette';

type Elevation = 'none' | 'low' | 'medium' | 'high';

const IOS_SHADOWS: Readonly<Record<Elevation, ViewStyle>> = {
  none: {},
  low: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  medium: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  high: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
  },
};

/**
 * Android ignores shadowRadius, so elevation carries the depth. A hairline rim
 * keeps edges readable where the platform shadow is too flat.
 */
const ANDROID_SHADOWS: Readonly<Record<Elevation, ViewStyle>> = {
  none: {},
  low: { elevation: 2 },
  medium: { elevation: 8 },
  high: { elevation: 16 },
};

export const shadows: Readonly<Record<Elevation, ViewStyle>> = Platform.select({
  ios: IOS_SHADOWS,
  android: ANDROID_SHADOWS,
  default: IOS_SHADOWS,
});

export const rimColor = withAlpha(palette.white, alpha.medium);
