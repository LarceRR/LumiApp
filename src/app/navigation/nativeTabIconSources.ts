import Ionicons from '@expo/vector-icons/Ionicons';
import type { ImageSourcePropType, ImageURISource } from 'react-native';
import { TAB_ROUTES, type TabRouteName } from './tabRoutes';

export type TabIconSourcePair = { readonly default: ImageSourcePropType; readonly selected: ImageSourcePropType };
export type NativeTabIconSources = Readonly<Record<TabRouteName, TabIconSourcePair>>;

/** Raster fallback for platforms/versions that do not use SF Symbols. */
const ICON_SIZE = 24;
const TEMPLATE_COLOR = '#000000';
let cachedSources: NativeTabIconSources | null = null;
let loadPromise: Promise<NativeTabIconSources> | null = null;
function asSquareSource(source: ImageSourcePropType): ImageSourcePropType { if (typeof source === 'number' || Array.isArray(source)) return source; return { ...(source as ImageURISource), width: ICON_SIZE, height: ICON_SIZE }; }
export function loadNativeTabIconSources(): Promise<NativeTabIconSources> { if (cachedSources !== null) return Promise.resolve(cachedSources); loadPromise ??= (async () => { const entries = await Promise.all(TAB_ROUTES.map(async (route) => { const [defaultSrc, selectedSrc] = await Promise.all([Ionicons.getImageSource(route.glyphs.inactive, ICON_SIZE, TEMPLATE_COLOR), Ionicons.getImageSource(route.glyphs.active, ICON_SIZE, TEMPLATE_COLOR)]); if (defaultSrc === null || selectedSrc === null) throw new Error(`Failed to rasterize tab icons for "${route.name}"`); return [route.name, { default: asSquareSource(defaultSrc), selected: asSquareSource(selectedSrc) }] as const; })); cachedSources = Object.fromEntries(entries) as NativeTabIconSources; return cachedSources; })(); return loadPromise; }
export function getNativeTabIconSources(): NativeTabIconSources | null { return cachedSources; }
