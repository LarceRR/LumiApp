import {
  forwardRef,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
} from "react-native";
import { BottomSheet as Sheet, type BottomSheetRef } from "react-native-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColors } from "../../colors/colors";
import { radius } from "../../radius/radius";
import { layout, spacing } from "../../spacing/spacing";
import { useKeyboardHeight } from "./hooks/useKeyboardHeight";

export type BottomSheetProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly heightFraction?: number;
  readonly keyboardAware?: boolean;
  readonly onSheetLayout?: (height: number) => void;
};

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  function BottomSheet(
    {
      visible,
      onClose,
      children,
      heightFraction,
      keyboardAware = false,
      onSheetLayout,
    },
    ref,
  ) {
    const sheetRef = useRef<BottomSheetRef>(null);

    const { height: windowHeight } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const theme = useThemeColors();

    const keyboardHeight = useKeyboardHeight();

    const baseHeight = Math.max(220, windowHeight * (heightFraction ?? 0));

    const maxSheetHeight = windowHeight - insets.top;

    const sheetHeight = keyboardAware
      ? Math.min(maxSheetHeight, baseHeight + keyboardHeight)
      : baseHeight;

    useImperativeHandle(ref, () => sheetRef.current as BottomSheetRef, []);

    useEffect(() => {
      if (visible) {
        sheetRef.current?.show();
      } else {
        sheetRef.current?.hide();
      }
    }, [visible]);

    return (
      <Sheet
        ref={sheetRef}
        height={sheetHeight}
        onRequestClose={onClose}
        onCloseFinish={onClose}
        backdropClosesSheet
        showDragIcon={false}
        backdropBackgroundColor="transparent"
        sheetBackgroundColor={theme.surfaceRaised}
        borderRadius={radius.xl}
        sheetStyle={styles.sheet}
        contentContainerStyle={styles.content}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={insets.top}
          onLayout={(event) => onSheetLayout?.(event.nativeEvent.layout.height)}
        >
          <View
            style={{
              paddingBottom: insets.bottom + spacing.lg,
              alignItems: "stretch",
            }}
          >
            {children}
          </View>
        </KeyboardAvoidingView>
      </Sheet>
    );
  },
);

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  content: {
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
});
