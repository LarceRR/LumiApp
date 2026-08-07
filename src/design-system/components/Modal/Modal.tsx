import { memo, type ReactElement, type ReactNode } from 'react';
import { Platform, Pressable, Modal as RNModal, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { icons } from '../../icons/icons';
import { radius } from '../../radius/radius';
import { layout, spacing } from '../../spacing/spacing';
import { useTheme } from '../../theme';
import { IconButton } from '../IconButton/IconButton';
import { Text } from '../Text/Text';

/**
 * `tall` claims the lower half of the screen. Used when the scene behind the
 * sheet has to reframe its subject into the space above it.
 */
export type ModalSize = 'auto' | 'tall';

export type ModalProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  readonly size?: ModalSize;
};

/** Share of screen height a tall sheet occupies. Mirrors SHEET_SCREEN_SHARE in the scene. */
export const TALL_SHEET_SCREEN_SHARE = 0.56;

function ModalComponent({
  visible,
  onClose,
  title,
  children,
  size = 'auto',
}: ModalProps): ReactElement {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

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
        style={[styles.scrim, { backgroundColor: colors.scrim }]}
      >
        <Pressable accessibilityLabel="Закрыть" style={styles.scrimTouch} onPress={onClose} />
      </Animated.View>
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <Animated.View
          entering={SlideInDown}
          exiting={SlideOutDown}
          style={[
            styles.sheet,
            { backgroundColor: colors.surfaceRaised, paddingBottom: insets.bottom + spacing.lg },
            size === 'tall' && styles.tall,
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.surfaceDivider }]} />
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
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  tall: {
    minHeight: `${Math.round(TALL_SHEET_SCREEN_SHARE * 100)}%`,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.pill,
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
