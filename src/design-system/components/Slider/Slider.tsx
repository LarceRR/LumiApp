import RNSlider from '@react-native-community/slider';
import { memo, type ReactElement } from 'react';

import { useTheme } from '../../theme';

export type SliderProps = {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly onChange: (value: number) => void;
  readonly accessibilityLabel: string;
};

function SliderComponent({
  value,
  min,
  max,
  step,
  onChange,
  accessibilityLabel,
}: SliderProps): ReactElement {
  const { colors } = useTheme();

  return (
    <RNSlider
      accessibilityLabel={accessibilityLabel}
      minimumValue={min}
      maximumValue={max}
      step={step}
      value={value}
      onValueChange={onChange}
      minimumTrackTintColor={colors.accent}
      maximumTrackTintColor={colors.controlTrack}
      thumbTintColor={colors.surfaceRaised}
      style={{ height: 36 }}
    />
  );
}

export const Slider = memo(SliderComponent);
