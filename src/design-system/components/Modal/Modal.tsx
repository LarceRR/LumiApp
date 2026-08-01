import { memo, type ReactElement, type ReactNode } from 'react';
import { Platform, Pressable, Modal as RNModal, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../colors/colors';
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
};

function ModalComponent({ visible, onClose, title, children }: ModalProps): ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrim}>
        <Pressable accessibilityLabel="Закрыть" style={styles.scrimTouch} onPress={onClose} />
      </Animated.View>
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <Animated.View
          entering={SlideInDown}
          exiting={SlideOutDown}
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
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
    backgroundColor: colors.scrim,
  },
  scrimTouch: {
    flex: 1,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceRaised,
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
