import { alpha, palette, withAlpha } from './palette';

export const colors = {
  surface: palette.stone050,
  surfaceRaised: palette.stone000,
  surfaceSunken: palette.stone100,
  surfaceDivider: withAlpha(palette.ink800, alpha.subtle),

  textPrimary: palette.ink800,
  textSecondary: palette.ink400,
  textTertiary: palette.ink200,
  textInverted: palette.stone000,

  accent: palette.ember500,
  accentSoft: withAlpha(palette.ember400, alpha.subtle),
  accentPressed: palette.ember400,

  positive: palette.moss500,
  negative: palette.crimson500,

  glassTint: withAlpha(palette.stone050, alpha.medium),
  glassRim: withAlpha(palette.white, alpha.medium),
  glassRimAndroid: withAlpha(palette.ink800, alpha.faint),
  glassFillAndroid: withAlpha(palette.stone050, alpha.strong),

  controlActive: palette.ink800,
  controlInactive: withAlpha(palette.ink800, alpha.medium),

  scrim: withAlpha(palette.ink900, alpha.medium),
  skeleton: withAlpha(palette.ink800, alpha.faint),
} as const;

/**
 * Scene colours are kept separate from UI tokens — they tint objects on the surface.
 */
export const sceneColors = {
  background: palette.stone050,
  surfaceBase: '#DFD8C9',
  surfaceDeep: '#C3BAA6',
  surfaceBreath: '#FFF1DA',
  /** Cell guides: visible enough to read as a grid, never as a table. */
  surfaceGrid: '#AEA48C',
  /** Marks the centre of a cell — the exact spot an object stands on. */
  surfaceDot: '#8C8168',
  /** Contact shadow under an object; darker than the surface, never black. */
  shadow: '#7A705B',
  keyLight: '#FFF4E2',
  fillLight: '#CFD8E4',
  fireCore: '#E89200',
  /** Warm orange emissive for Flame_Core (Blender lambert1). */
  fireCoreEmissive: '#FF8A1F',
  fireShell: '#FE4F00',
  fireEmissive: '#FF8A1F',
  fireLight: '#FEC200',
  cloudBody: palette.slate300,
  cloudEdge: palette.slate500,
  selection: palette.ember300,
} as const;

export { alpha, palette, withAlpha };
