import { memo, type ReactElement } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { type TypographyVariant, typography } from '../../typography/typography';

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
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        color === undefined ? null : { color },
        align === undefined ? null : { textAlign: align },
        style,
      ]}
    />
  );
}

export const Text = memo(TextComponent);
