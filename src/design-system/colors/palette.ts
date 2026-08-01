/** Raw values. Never referenced outside `colors.ts` — semantics live there. */
export const palette = {
  stone000: '#FDFDFB',
  stone050: '#F6F6F3',
  stone100: '#ECECE7',
  stone200: '#DEDED7',
  stone300: '#C8C8BF',

  ink900: '#141414',
  ink800: '#1A1A1A',
  ink600: '#3D3D3D',
  ink400: '#5C5C5C',
  ink200: '#8A8A8A',

  ember500: '#C45C2A',
  ember400: '#E1743A',
  ember300: '#F2A05A',
  ember200: '#FFC98A',

  slate500: '#5B6472',
  slate400: '#7C8796',
  slate300: '#A6B0BD',

  moss500: '#4E7A5C',
  crimson500: '#A8342F',

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
