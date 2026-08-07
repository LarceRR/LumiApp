/**
 * Raw values. Never referenced outside `tokens.ts` — semantics live there.
 *
 * The system is built around one idea from the design plan: the app is a quiet
 * object, and the only truly saturated thing in it is fire. Every neutral is
 * therefore low-chroma and slightly off-hue, so an ember reads as the single
 * source of colour in the frame.
 *
 * Light neutrals are warm paper (Cloud). Dark neutrals are deliberately *not*
 * inverted paper — they carry a violet cast (Basalt), which keeps a warm flame
 * from turning muddy the way it does on a warm-grey dark theme.
 */
export const palette = {
  /** Warm paper. Never pure white — pure white reads as "unfinished" next to a flame. */
  cloud000: '#FCFBF8',
  cloud050: '#F7F6F2',
  cloud100: '#F0EEE8',
  cloud200: '#E4E1D8',
  cloud300: '#CFCBBF',
  cloud400: '#B0AB9C',

  /** Cool violet-cast darks. Not black: OLED-black crushes the bloom falloff. */
  basalt900: '#0D0C11',
  basalt800: '#141319',
  basalt700: '#1C1A23',
  basalt600: '#25232E',
  basalt500: '#312E3C',
  basalt400: '#413D4F',

  /** Text on light. Warm charcoal — #000 on warm paper looks like a printing error. */
  ink900: '#17161A',
  ink800: '#1F1E23',
  ink700: '#2F2D34',
  ink500: '#56535E',
  ink300: '#87838F',

  /** Text on dark. */
  mist000: '#F5F3F8',
  mist100: '#E6E3EC',
  mist300: '#C2BDCD',
  mist500: '#948FA1',
  mist700: '#6A6577',

  /**
   * The hero. Saffron → rust, pushed off the predictable #FF7A00 axis:
   * every step keeps a little red so the ramp reads as combustion, not "orange".
   */
  ember050: '#FFF3E6',
  ember100: '#FFE2C4',
  ember200: '#F9C79B',
  ember300: '#F1A46C',
  ember400: '#E37B41',
  ember500: '#C95C2C',
  ember600: '#A2431E',
  ember700: '#6E2C14',

  /**
   * Cool counterweight (the "digital lavender" thread that survived into 2026).
   * Used for anything that must recede behind the fire: clouds, cold light.
   */
  iris100: '#E4E1F2',
  iris200: '#C8C3E2',
  iris300: '#A79FCB',
  iris400: '#8880B0',
  iris500: '#6B638F',
  iris600: '#4E4869',

  /** Desaturated sage. Positive states, never "success green". */
  sage200: '#C4D2C2',
  sage400: '#829C86',
  sage500: '#5F7A66',

  /** Muted rosewood. Destructive states without competing with the flame. */
  rose300: '#DCA3AC',
  rose400: '#BC6C7D',
  rose500: '#9A4257',

  white: '#FFFFFF',
  black: '#000000',
} as const;

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
