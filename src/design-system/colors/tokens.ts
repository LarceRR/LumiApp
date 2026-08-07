import { alpha, palette, withAlpha } from './palette';

/**
 * Semantic UI colours. Components only ever read these — never `palette`.
 * Both themes implement the same contract, so a component written once works
 * in either without a single conditional.
 */
export type ColorTokens = {
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly surfaceSunken: string;
  readonly surfaceDivider: string;

  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textTertiary: string;
  readonly textInverted: string;

  readonly accent: string;
  readonly accentSoft: string;
  readonly accentPressed: string;
  /** Cool secondary. Anything that must sit behind the fire. */
  readonly secondary: string;
  readonly secondarySoft: string;

  readonly positive: string;
  readonly negative: string;

  readonly glassTint: string;
  readonly glassRim: string;
  readonly glassRimAndroid: string;
  readonly glassFillAndroid: string;
  /** Blur tint for expo-blur on non-Liquid-Glass iOS. */
  readonly blurTint: 'light' | 'dark';

  readonly controlActive: string;
  readonly controlInactive: string;
  readonly controlTrack: string;

  readonly scrim: string;
  readonly skeleton: string;

  /** Status-bar content style that stays legible on `surface`. */
  readonly statusBarStyle: 'light' | 'dark';
};

/**
 * Scene colours tint objects on the 3D surface. Kept apart from UI tokens: the
 * surface has its own physics (emissive values above 1.0, fog, bloom) and must
 * not inherit UI contrast rules.
 */
export type SceneTokens = {
  readonly background: string;
  readonly surfaceBase: string;
  readonly surfaceDeep: string;
  readonly surfaceBreath: string;
  readonly surfaceGrid: string;
  readonly surfaceDot: string;
  readonly shadow: string;
  readonly keyLight: string;
  readonly fillLight: string;
  readonly ambientLight: string;
  readonly fireCore: string;
  readonly fireCoreEmissive: string;
  readonly fireShell: string;
  readonly fireEmissive: string;
  readonly fireLight: string;
  readonly cloudBody: string;
  readonly cloudEdge: string;
  readonly selection: string;
  /** Oldest object on the surface. */
  readonly firstCell: string;
  /** Newest object on the surface. */
  readonly lastCell: string;
};

export const lightColors: ColorTokens = {
  surface: palette.cloud050,
  surfaceRaised: palette.cloud000,
  surfaceSunken: palette.cloud100,
  surfaceDivider: withAlpha(palette.ink800, alpha.subtle),

  textPrimary: palette.ink900,
  textSecondary: palette.ink500,
  textTertiary: palette.ink300,
  textInverted: palette.cloud000,

  accent: palette.ember500,
  accentSoft: withAlpha(palette.ember400, alpha.subtle),
  accentPressed: palette.ember600,
  secondary: palette.iris500,
  secondarySoft: withAlpha(palette.iris400, alpha.subtle),

  positive: palette.sage500,
  negative: palette.rose500,

  glassTint: withAlpha(palette.cloud050, alpha.medium),
  glassRim: withAlpha(palette.white, alpha.medium),
  glassRimAndroid: withAlpha(palette.ink800, alpha.faint),
  glassFillAndroid: withAlpha(palette.cloud000, alpha.strong),
  blurTint: 'light',

  controlActive: palette.ink900,
  controlInactive: withAlpha(palette.ink800, alpha.medium),
  controlTrack: palette.cloud200,

  scrim: withAlpha(palette.ink900, alpha.medium),
  skeleton: withAlpha(palette.ink800, alpha.faint),

  statusBarStyle: 'dark',
};

/**
 * Authored, not inverted. Two deliberate departures from the light theme:
 * the neutrals lose their warmth (violet cast) and the accent moves one step
 * brighter, so the ember stays the most saturated pixel on a dark surface.
 */
export const darkColors: ColorTokens = {
  surface: palette.basalt800,
  surfaceRaised: palette.basalt700,
  surfaceSunken: palette.basalt900,
  surfaceDivider: withAlpha(palette.mist000, alpha.subtle),

  textPrimary: palette.mist000,
  textSecondary: palette.mist300,
  textTertiary: palette.mist500,
  textInverted: palette.basalt900,

  accent: palette.ember400,
  accentSoft: withAlpha(palette.ember300, alpha.subtle),
  accentPressed: palette.ember300,
  secondary: palette.iris300,
  secondarySoft: withAlpha(palette.iris300, alpha.subtle),

  positive: palette.sage400,
  negative: palette.rose400,

  glassTint: withAlpha(palette.basalt700, alpha.medium),
  glassRim: withAlpha(palette.mist000, alpha.subtle),
  glassRimAndroid: withAlpha(palette.mist000, alpha.subtle),
  glassFillAndroid: withAlpha(palette.basalt700, alpha.strong),
  blurTint: 'dark',

  controlActive: palette.mist000,
  controlInactive: withAlpha(palette.mist000, alpha.medium),
  controlTrack: palette.basalt600,

  scrim: withAlpha(palette.black, 0.6),
  skeleton: withAlpha(palette.mist000, alpha.faint),

  statusBarStyle: 'light',
};

export const lightSceneColors: SceneTokens = {
  background: palette.cloud050,
  surfaceBase: '#E8E4DA',
  surfaceDeep: '#CFC9BB',
  surfaceBreath: '#FFF4E4',
  surfaceGrid: '#BFB9AB',
  surfaceDot: '#8F8877',
  shadow: '#7C7566',
  keyLight: '#FFF4E2',
  fillLight: '#D5D2E6',
  ambientLight: '#FFF6E6',
  fireCore: '#FFB347',
  fireCoreEmissive: '#FF8A1F',
  fireShell: '#FE4F00',
  fireEmissive: '#FF8A1F',
  fireLight: '#FEC200',
  cloudBody: palette.iris200,
  cloudEdge: palette.iris500,
  selection: palette.ember300,
  firstCell: palette.sage400,
  lastCell: palette.ember300,
};

export const darkSceneColors: SceneTokens = {
  background: palette.basalt900,
  surfaceBase: '#1A1822',
  surfaceDeep: '#12111A',
  surfaceBreath: '#3A2C2A',
  surfaceGrid: '#2E2B3A',
  surfaceDot: '#443F55',
  shadow: '#08070C',
  keyLight: '#FFE9C6',
  fillLight: '#6E6A96',
  ambientLight: '#2A2636',
  fireCore: '#FFC163',
  fireCoreEmissive: '#FF9A2E',
  fireShell: '#FF5A0A',
  fireEmissive: '#FF9A2E',
  fireLight: '#FFCE3D',
  cloudBody: palette.iris400,
  cloudEdge: palette.iris200,
  selection: palette.ember300,
  firstCell: palette.sage400,
  lastCell: palette.ember400,
};
