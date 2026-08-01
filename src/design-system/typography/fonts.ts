import { Platform } from 'react-native';

/**
 * iOS ships SF Pro as the system face, Android is meant to use Inter. Until the
 * Inter binaries are registered through `expo-font`, Android falls back to the
 * platform sans face so the app never renders a missing-font box.
 */
export const interFamilies = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
} as const;

export type FontWeightToken = 'regular' | 'medium' | 'semiBold';

let interAvailable = false;

export function markInterAvailable(available: boolean): void {
  interAvailable = available;
}

export function isInterAvailable(): boolean {
  return interAvailable;
}

const SYSTEM_FAMILY = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const SYSTEM_MEDIUM_FAMILY = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

export function fontFamily(weight: FontWeightToken): string {
  if (Platform.OS === 'android') {
    if (interAvailable) {
      return interFamilies[weight];
    }

    return weight === 'regular' ? SYSTEM_FAMILY : SYSTEM_MEDIUM_FAMILY;
  }

  return SYSTEM_FAMILY;
}

/**
 * Android renders synthetic bold badly when a real weight face exists, so the
 * numeric weight is only emitted where the platform maps it to a real face.
 */
export const fontWeights = {
  regular: '400',
  medium: '500',
  semiBold: '600',
} as const satisfies Readonly<Record<FontWeightToken, '400' | '500' | '600'>>;
