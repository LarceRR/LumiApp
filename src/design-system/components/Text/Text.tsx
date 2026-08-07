import { memo, type ReactElement } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '../../theme';
import { type TypographyVariant, typography, typographyColor } from '../../typography/typography';

export type TextProps = RNTextProps & {
  readonly variant?: TypographyVariant;
  readonly color?: string;
  readonly align?: 'auto' | 'left' | 'right' | 'center';
};

function TextComponent({
  variant = 'body',
  color,
  align,
  style,
  ...rest
}: TextProps): ReactElement {
  const { colors } = useTheme();

  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color: color ?? typographyColor(variant, colors) },
        align === undefined ? null : { textAlign: align },
        style,
      ]}
    />
  );
}

export const Text = memo(TextComponent);
