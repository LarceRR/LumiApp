import { forwardRef, type ReactNode, useEffect, useImperativeHandle, useRef } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BottomSheet as Sheet, type BottomSheetRef } from 'react-native-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '../../colors/colors';
import { radius } from '../../radius/radius';
import { layout, spacing } from '../../spacing/spacing';

export type BottomSheetProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly heightFraction?: number;
  readonly onSheetLayout?: (height: number) => void;
};

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(function BottomSheet(
  { visible, onClose, children, heightFraction, onSheetLayout },
  ref,
) {
  const sheetRef = useRef<BottomSheetRef>(null);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const sheetHeight = Math.max(220, height * (heightFraction ?? 0.56));

  useImperativeHandle(ref, () => sheetRef.current as BottomSheetRef, []);

  useEffect(() => {
    if (visible) sheetRef.current?.show();
    else sheetRef.current?.hide();
  }, [visible]);

  return (
    <Sheet
      ref={sheetRef}
      height={sheetHeight}
      onRequestClose={onClose}
      onCloseFinish={onClose}
      backdropClosesSheet
      backdropBackgroundColor="transparent"
      sheetBackgroundColor={theme.surfaceRaised}
      borderRadius={radius.xl}
      sheetStyle={styles.sheet}
      contentContainerStyle={styles.content}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
        onLayout={(event) => onSheetLayout?.(event.nativeEvent.layout.height)}
      >
        <View style={{ paddingBottom: insets.bottom + spacing.lg }}>{children}</View>
      </KeyboardAvoidingView>
    </Sheet>
  );
});

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  content: { paddingHorizontal: layout.screenGutter, paddingTop: spacing.lg, gap: spacing.lg },
});