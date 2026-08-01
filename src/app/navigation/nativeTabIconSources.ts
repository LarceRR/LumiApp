import Ionicons from '@expo/vector-icons/Ionicons';
import type { ImageSourcePropType } from 'react-native';

import { TAB_ROUTES, type TabRouteName } from './tabRoutes';

export type TabIconSourcePair = {
  readonly default: ImageSourcePropType;
  readonly selected: ImageSourcePropType;
};

export type NativeTabIconSources = Readonly<Record<TabRouteName, TabIconSourcePair>>;

/** Template tint is applied by UIKit; rasterize with a neutral color once. */
const ICON_SIZE = 25;
const TEMPLATE_COLOR = '#000000';

let cachedSources: NativeTabIconSources | null = null;
let loadPromise: Promise<NativeTabIconSources> | null = null;

/**
 * Rasterize Ionicons once before NativeTabs mounts. Async tab icons on iOS 26
 * mutate UITabBarItem after layout and leave label slots with stale widths
 * (labels truncate or vanish during glass morph / drag).
 */
export function loadNativeTabIconSources(): Promise<NativeTabIconSources> {
  if (cachedSources !== null) {
    return Promise.resolve(cachedSources);
  }

  loadPromise ??= (async () => {
    const entries = await Promise.all(
      TAB_ROUTES.map(async (route) => {
        const [defaultSrc, selectedSrc] = await Promise.all([
          Ionicons.getImageSource(route.glyphs.inactive, ICON_SIZE, TEMPLATE_COLOR),
          Ionicons.getImageSource(route.glyphs.active, ICON_SIZE, TEMPLATE_COLOR),
        ]);

        if (defaultSrc === null || selectedSrc === null) {
          throw new Error(`Failed to rasterize tab icons for "${route.name}"`);
        }

        return [route.name, { default: defaultSrc, selected: selectedSrc }] as const;
      }),
    );

    cachedSources = Object.fromEntries(entries) as NativeTabIconSources;
    return cachedSources;
  })();

  return loadPromise;
}

export function getNativeTabIconSources(): NativeTabIconSources | null {
  return cachedSources;
}
