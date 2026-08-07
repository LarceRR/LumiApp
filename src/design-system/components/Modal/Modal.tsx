import { memo, type ReactElement, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  Modal as RNModal,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '../../colors/themeStore';
import { icons } from '../../icons/icons';
import { radius } from '../../radius/radius';
import { layout, spacing } from '../../spacing/spacing';
import { IconButton } from '../IconButton/IconButton';
import { Text } from '../Text/Text';

export type ModalProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  /**
   * Minimum sheet height as a fraction of the viewport. Used by inspect sheets
   * that deliberately claim the lower half of the screen so the scene can frame
   * the focused object above them.
   */
  readonly heightFraction?: number;
};

function ModalComponent({
  visible,
  onClose,
  title,
  children,
  heightFraction,
}: ModalProps): ReactElement {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { height } = useWindowDimensions();

  return (
    <RNModal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={[styles.scrim, { backgroundColor: theme.scrim }]}
      >
        <Pressable accessibilityLabel="Закрыть" style={styles.scrimTouch} onPress={onClose} />
      </Animated.View>
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <Animated.View
          entering={SlideInDown}
          exiting={SlideOutDown}
          style={[
            styles.sheet,
            { backgroundColor: theme.surfaceRaised },
            heightFraction === undefined ? null : { minHeight: height * heightFraction },
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
        >
          <View style={styles.header}>
            <Text variant="sectionTitle" style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <IconButton icon={icons.close} accessibilityLabel="Закрыть" onPress={onClose} />
          </View>
          {children}
        </Animated.View>
      </View>
    </RNModal>
  );
}

export const Modal = memo(ModalComponent);

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  scrimTouch: {
    flex: 1,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    flex: 1,
  },
});
