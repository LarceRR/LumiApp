import type { TextStyle } from 'react-native';

import type { ColorTokens } from '../colors/tokens';
import { type FontWeightToken, fontFamily, fontWeights } from './fonts';

/**
 * Type scale, without colour.
 *
 * Colour is a theme decision, not a type decision — baking it here is what
 * makes a design system impossible to put into dark mode later. A variant
 * declares its *tone*; `Text` resolves the tone against the active theme.
 */
function style(
  size: number,
  lineHeight: number,
  weight: FontWeightToken,
  letterSpacing: number,
): TextStyle {
  return {
    fontFamily: fontFamily(weight),
    fontWeight: fontWeights[weight],
    fontSize: size,
    lineHeight,
    letterSpacing,
  };
}

export const typography = {
  display: style(34, 40, 'semiBold', -0.6),
  screenTitle: style(28, 34, 'semiBold', -0.4),
  sectionTitle: style(20, 26, 'semiBold', -0.2),
  body: style(16, 22, 'regular', 0),
  bodyStrong: style(16, 22, 'medium', 0),
  caption: style(13, 18, 'regular', 0.1),
  captionStrong: style(13, 18, 'medium', 0.1),
  label: style(15, 20, 'medium', 0.1),
  tabLabel: style(11, 14, 'medium', 0.1),
  numeric: style(15, 20, 'medium', 0.4),
} as const;

export type TypographyVariant = keyof typeof typography;

type Tone = 'primary' | 'secondary';

const TONES: Readonly<Record<TypographyVariant, Tone>> = {
  display: 'primary',
  screenTitle: 'primary',
  sectionTitle: 'primary',
  body: 'primary',
  bodyStrong: 'primary',
  caption: 'secondary',
  captionStrong: 'primary',
  label: 'primary',
  tabLabel: 'primary',
  numeric: 'primary',
};

export function typographyColor(variant: TypographyVariant, colors: ColorTokens): string {
  return TONES[variant] === 'secondary' ? colors.textSecondary : colors.textPrimary;
}
