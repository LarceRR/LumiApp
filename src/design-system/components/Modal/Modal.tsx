import { memo, type ReactElement, type ReactNode } from 'react';
import { KeyboardAvoidingView, Keyboard, Platform, Pressable, Modal as RNModal, StyleSheet, useWindowDimensions, View } from 'react-native';
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
  readonly heightFraction?: number;
  readonly scrimOpacity?: number;
};

function ModalComponent({ visible, onClose, title, children, heightFraction, scrimOpacity = 0.24 }: ModalProps): ReactElement {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { height } = useWindowDimensions();
  const dismissKeyboard = (): void => Keyboard.dismiss();

  return (
    <RNModal animationType="none" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent={Platform.OS === 'android'}>
      <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.scrim, { backgroundColor: theme.scrim, opacity: scrimOpacity / 0.24 }]}>
        <Pressable accessibilityLabel="Закрыть" style={styles.scrimTouch} onPress={onClose} />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top} style={styles.sheetWrap}>
        <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.sheet, { backgroundColor: theme.surfaceRaised, paddingBottom: insets.bottom + spacing.lg }, heightFraction === undefined ? null : { minHeight: height * heightFraction }]}>
          <View style={styles.header}>
            <Text variant="sectionTitle" style={styles.title} numberOfLines={1}>{title}</Text>
            <IconButton icon={icons.close} accessibilityLabel="Закрыть" onPress={onClose} />
          </View>
          {children}
          <Pressable accessibilityRole="button" accessibilityLabel="Скрыть клавиатуру" onPress={dismissKeyboard} style={styles.keyboardButton}>
            <Text variant="caption">Скрыть клавиатуру</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

export const Modal = memo(ModalComponent);

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject },
  scrimTouch: { flex: 1 },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: layout.screenGutter, paddingTop: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: 1 },
  keyboardButton: { alignSelf: 'center', paddingVertical: spacing.xs },
});
