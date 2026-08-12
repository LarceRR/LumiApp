import { memo, type ReactElement } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';

import { useThemeColors } from '@/design-system/colors/colors';
import { BottomSheet } from '@/design-system/components/BottomSheet/BottomSheet';
import { Button } from '@/design-system/components/Button/Button';
import { Text } from '@/design-system/components/Text/Text';
import { radius } from '@/design-system/radius/radius';
import { spacing } from '@/design-system/spacing/spacing';
import { typography } from '@/design-system/typography/typography';
import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { kindPresentation } from '@/scene/surface-objects/kindPresentation';

export type CreateObjectSheetProps = { readonly visible: boolean; readonly kind: SurfaceObjectKind | null; readonly note: string; readonly onChangeNote: (note: string) => void; readonly onConfirm: () => void; readonly onClose: () => void };
const NOTE_LIMIT = 240;

function CreateObjectSheetComponent({ visible, kind, note, onChangeNote, onConfirm, onClose }: CreateObjectSheetProps): ReactElement | null {
  const theme = useThemeColors();
  if (kind === null) return null;
  const presentation = kindPresentation(kind);
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text variant="sectionTitle">{presentation.createLabel}</Text>
      <Text variant="caption">Опишите момент, он останется в истории вместе с объектом. Место на поверхности выберется само.</Text>
      <View style={[styles.field, { backgroundColor: theme.surfaceSunken }]}>
        <TextInput value={note} onChangeText={onChangeNote} placeholder="Что произошло?" placeholderTextColor={theme.textTertiary} maxLength={NOTE_LIMIT} multiline returnKeyType="done" blurOnSubmit onSubmitEditing={() => Keyboard.dismiss()} style={[styles.input, { color: theme.textPrimary }]} />
      </View>
      <Button label={presentation.createLabel} onPress={onConfirm} />
    </BottomSheet>
  );
}
export const CreateObjectSheet = memo(CreateObjectSheetComponent);
const styles = StyleSheet.create({ field: { borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, input: { ...typography.body, minHeight: 88, textAlignVertical: 'top' } });