import { memo, type ReactElement } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useThemeColors } from '../../colors/themeStore';
import { type TypographyVariant, typography } from '../../typography/typography';

export type TextProps = RNTextProps & {
  readonly variant?: TypographyVariant;
  readonly color?: string;
  readonly align?: 'auto' | 'left' | 'right' | 'center';
};

type TextRole = 'primary' | 'secondary' | 'tertiary';

/**
 * Typography bakes a colour so plain `StyleSheet` users still get something
 * readable. The component overrides it from the active theme, which is what
 * makes dark mode work without touching every call site.
 */
const VARIANT_ROLE: Readonly<Record<TypographyVariant, TextRole>> = {
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

function TextComponent({
  variant = 'body',
  color,
  align,
  style,
  ...rest
}: TextProps): ReactElement {
  const theme = useThemeColors();
  const role = VARIANT_ROLE[variant];
  const themed =
    role === 'secondary'
      ? theme.textSecondary
      : role === 'tertiary'
        ? theme.textTertiary
        : theme.textPrimary;

  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color: color ?? themed },
        align === undefined ? null : { textAlign: align },
        style,
      ]}
    />
  );
}

export const Text = memo(TextComponent);
