/**
 * Raw colour values. Never referenced outside the colour system — semantics
 * live in `themes.ts`.
 *
 * ── How this palette was built ──────────────────────────────────────────────
 * Every ramp was laid out in OKLCH (perceptually even lightness steps, constant
 * hue, chroma tapering at the ends) and then written down as sRGB hex, because
 * React Native still has no OKLCH parser. The comments carry the intent so the
 * ramps can be regenerated without guessing.
 *
 * Three deliberate departures from the defaults everyone ships:
 *
 * 1. No pure white. `paper*` is a warm, slightly desaturated stock (hue ~85°,
 *    chroma ~0.008). Pure #FFFFFF reads as "unfinished HTML" on OLED and
 *    fatigues the eye at night.
 * 2. No pure black. `basalt*` is tilted toward violet-brown (hue ~300°,
 *    chroma ~0.012). A hued near-black keeps dark mode atmospheric instead of
 *    flat, and stops OLED smearing on scroll.
 * 3. No "tech blue" accent. The hero of this product is a flame, so the primary
 *    is a burnt saffron (`ember*`), counterweighted by a muted plum (`damson*`)
 *    for intimacy and a patina teal (`verdigris*`) for calm.
 */
export const palette = {
  // ── Paper — warm off-white neutrals. L 99 → 72, hue 85, chroma 0.006–0.012.
  paper000: '#FDFBF7',
  paper050: '#F7F4ED',
  paper100: '#EFEBE1',
  paper200: '#E3DED2',
  paper300: '#CFC9BA',
  paper400: '#B3AC9C',

  // ── Basalt — hued near-blacks. L 8 → 78, hue 300, chroma 0.010–0.016.
  basalt900: '#0C0A0E',
  basalt850: '#121017',
  basalt800: '#18151E',
  basalt750: '#1F1B26',
  basalt700: '#272231',
  basalt600: '#332D3E',
  basalt500: '#4B4457',
  basalt400: '#6E6679',
  basalt300: '#9A93A3',
  basalt200: '#C2BCC9',

  // ── Ember — primary. Burnt saffron, hue 55, peak chroma at 400/500.
  ember100: '#FFEBD1',
  ember200: '#FFD4A0',
  ember300: '#FBB268',
  ember400: '#F08C34',
  ember500: '#DA6A1E',
  ember600: '#B04E15',
  ember700: '#7C3510',

  // ── Damson — secondary. Muted plum, hue 340. Intimacy, memory, evening.
  damson200: '#E3C6D9',
  damson300: '#C795B4',
  damson400: '#A2648C',
  damson500: '#7C4468',
  damson600: '#582E4A',

  // ── Verdigris — tertiary. Patina teal, hue 180. Calm, trust, duration.
  verdigris200: '#BFE0D8',
  verdigris300: '#8CC5B9',
  verdigris400: '#4FA093',
  verdigris500: '#2E7A70',
  verdigris600: '#1E5751',

  // ── Signals. Desaturated on purpose: they must never out-shout the flame.
  moss300: '#7FB489',
  moss400: '#63976D',
  moss500: '#4F7E5A',
  madder300: '#E0736C',
  madder400: '#C4574F',
  madder500: '#A83B36',
  saffron300: '#E5AE5A',
  saffron500: '#C98A2E',

  // ── Slate — cool neutral, reserved for clouds and cold light.
  slate200: '#C3CBD6',
  slate300: '#A2AEBD',
  slate400: '#7C8796',
  slate500: '#5B6472',
  slate600: '#414855',

  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * Legacy aliases from the pre-2026 palette. Kept so untouched modules keep
 * compiling; new code should reach for the ramps above.
 *
 * @deprecated Use the named ramps in `palette`.
 */
export const legacyPalette = {
  stone000: palette.paper000,
  stone050: palette.paper050,
  stone100: palette.paper100,
  stone200: palette.paper200,
  stone300: palette.paper300,

  ink900: palette.basalt900,
  ink800: palette.basalt800,
  ink600: palette.basalt600,
  ink400: palette.basalt500,
  ink200: palette.basalt400,

  ember500: palette.ember500,
  ember400: palette.ember400,
  ember300: palette.ember300,
  ember200: palette.ember200,

  slate500: palette.slate500,
  slate400: palette.slate400,
  slate300: palette.slate300,

  moss500: palette.moss500,
  crimson500: palette.madder500,
} as const;

/** Everything the app can name, old names included. */
export const colorRamps = { ...palette, ...legacyPalette } as const;

export const alpha = {
  transparent: 0,
  faint: 0.06,
  subtle: 0.12,
  soft: 0.24,
  medium: 0.45,
  strong: 0.72,
  opaque: 1,
} as const;

export function withAlpha(hex: string, value: number): string {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${value})`;
}
