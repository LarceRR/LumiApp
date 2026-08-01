import { Platform } from 'react-native';

/** iOS uses the system tab bar (Liquid Glass on iOS 26+). Android keeps the floating custom bar. */
export function usesNativeTabBar(): boolean {
  return Platform.OS === 'ios';
}
