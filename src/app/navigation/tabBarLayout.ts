import { layout, spacing } from '@/design-system/spacing/spacing';

import { usesNativeTabBar } from './usesNativeTabBar';

/** iOS UITabBar stacked layout height (icon + label row, excluding home indicator). */
const IOS_NATIVE_TAB_BAR_HEIGHT = 49;

/** Total bottom overlay consumed by the native tab bar on iOS. */
export function nativeTabBarOverlayHeight(safeAreaBottom: number): number {
  return IOS_NATIVE_TAB_BAR_HEIGHT + Math.max(safeAreaBottom, 0);
}

/** Bottom inset for floating chrome (e.g. action bar) sitting above the tab bar. */
export function floatingChromeBottomInset(safeAreaBottom: number): number {
  if (usesNativeTabBar()) {
    return nativeTabBarOverlayHeight(safeAreaBottom) + spacing.sm;
  }

  return layout.tabBarHeight + layout.tabBarInset + Math.max(safeAreaBottom, spacing.sm);
}

/** Whether scrollable screens should reserve space for the floating custom tab bar. */
export function reservesFloatingTabBar(): boolean {
  return !usesNativeTabBar();
}

/**
 * Bottom padding for tab screens. Native tabs rely on ScrollView automatic content
 * inset adjustment on iOS — manual tab-bar padding would double-count and push
 * content down under the bar.
 */
export function tabScreenBottomPadding(
  safeAreaBottom: number,
  reserveFloatingTabBar: boolean,
): number {
  if (reserveFloatingTabBar) {
    return layout.tabBarHeight + layout.tabBarInset + Math.max(safeAreaBottom, spacing.lg);
  }

  if (usesNativeTabBar()) {
    return spacing.lg;
  }

  return Math.max(safeAreaBottom, spacing.lg);
}
