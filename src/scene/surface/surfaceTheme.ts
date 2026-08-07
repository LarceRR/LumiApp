/**
 * Цвета самой поверхности.
 *
 * Фон настраивается пользователем (Настройки → Внешний вид) либо следует за
 * темой. Всё, что красит поверхность — clear-color, `scene.background`, туман,
 * шейдер грида и подложка Canvas — берёт его отсюда, а не из константы.
 */

export type SurfaceScheme = 'light' | 'dark';

/** Тёплая бумага, а не чистый белый: см. docs/design/color-system.md. */
export const LIGHT_SURFACE_BACKGROUND = '#F7F4ED';

/** Near-black с фиолетовым уклоном — не #000. */
export const DARK_SURFACE_BACKGROUND = '#121017';

/**
 * @deprecated Фон по умолчанию теперь зависит от темы.
 * Используйте `resolveSurfaceBackground(null, scheme)`.
 */
export const DEFAULT_SURFACE_BACKGROUND = LIGHT_SURFACE_BACKGROUND;

/** `null` в настройках означает «подстраиваться под тему». */
export function resolveSurfaceBackground(
  value: string | null,
  scheme: SurfaceScheme,
): string {
  if (value !== null) {
    return value;
  }

  return scheme === 'dark' ? DARK_SURFACE_BACKGROUND : LIGHT_SURFACE_BACKGROUND;
}

/** Порядок от светлого к тёмному — ровно так их рисует палитра в настройках. */
export const SURFACE_BACKGROUND_OPTIONS: readonly string[] = [
  '#FDFBF7',
  '#F7F4ED',
  '#EFE9DA',
  '#E3E7EA',
  '#C6CDD6',
  '#7C8796',
  '#3A3644',
  '#272231',
  '#18151E',
  '#0C0A0E',
];

/**
 * Насколько линии грида уходят от фона: чуть темнее на светлом, светлее на
 * тёмном.
 *
 * Ровно вдвое меньше прежних значений (0.08 / 0.14). Сетка должна
 * *чувствоваться*, а не читаться — иначе поверхность превращается в таблицу и
 * начинает спорить с объектами.
 */
const LIGHT_GRID_MIX = 0.04;
const DARK_GRID_MIX = 0.07;

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

/** Линии грида всегда чуть контрастнее фона и никогда не спорят с объектами. */
export function gridColorFor(background: string): string {
  const rgb = parseHex(background);
  const light = isLightSurface(background);

  return toHex(mix(rgb, light ? BLACK : WHITE, light ? LIGHT_GRID_MIX : DARK_GRID_MIX));
}
