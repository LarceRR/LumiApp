/**
 * Цвета самой поверхности.
 *
 * Фон настраивается пользователем (Настройки → Сцена), поэтому всё, что красит
 * поверхность — clear-color, `scene.background`, туман, шейдер грида и подложка
 * Canvas — берёт его отсюда, а не из константы.
 */

export const DEFAULT_SURFACE_BACKGROUND = '#FFFFFF';

/** Порядок от светлого к тёмному — ровно так их рисует палитра в настройках. */
export const SURFACE_BACKGROUND_OPTIONS: readonly string[] = [
  '#FFFFFF',
  '#F6F6F3',
  '#EFE7D8',
  '#E3E9EE',
  '#C9D2DC',
  '#7C8796',
  '#3A3F47',
  '#22252B',
  '#14100D',
  '#0B0B0C',
];

/** Насколько линии грида уходят от фона: чуть темнее на светлом, светлее на тёмном. */
const LIGHT_GRID_MIX = 0.08;
const DARK_GRID_MIX = 0.14;

type Rgb = { readonly r: number; readonly g: number; readonly b: number };

const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const WHITE: Rgb = { r: 255, g: 255, b: 255 };

function channel(source: string, from: number): number {
  const value = Number.parseInt(source.slice(from, from + 2), 16);

  return Number.isNaN(value) ? 0 : value;
}

function parseHex(hex: string): Rgb {
  const normalized = hex.trim().replace('#', '');
  const expanded =
    normalized.length === 3
      ? [...normalized].map((symbol) => `${symbol}${symbol}`).join('')
      : normalized;

  return { r: channel(expanded, 0), g: channel(expanded, 2), b: channel(expanded, 4) };
}

function toHex(rgb: Rgb): string {
  const part = (value: number): string =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();

  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`;
}

function mix(color: Rgb, target: Rgb, amount: number): Rgb {
  return {
    r: color.r + (target.r - color.r) * amount,
    g: color.g + (target.g - color.g) * amount,
    b: color.b + (target.b - color.b) * amount,
  };
}

/** Воспринимаемая яркость, 0 (чёрный) … 1 (белый). */
export function surfaceLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);

  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function isLightSurface(background: string): boolean {
  return surfaceLuminance(background) > 0.5;
}

/**
 * Линии грида всегда чуть контрастнее фона и никогда не спорят с объектами.
 * Для белого фона это ровно прежний `#EBEBEB`.
 */
export function gridColorFor(background: string): string {
  const rgb = parseHex(background);
  const light = isLightSurface(background);

  return toHex(mix(rgb, light ? BLACK : WHITE, light ? LIGHT_GRID_MIX : DARK_GRID_MIX));
}
