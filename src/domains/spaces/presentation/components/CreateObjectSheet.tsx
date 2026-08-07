import { memo, type ReactElement } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/design-system/components/Button/Button';
import { Modal } from '@/design-system/components/Modal/Modal';
import { Text } from '@/design-system/components/Text/Text';
import { radius } from '@/design-system/radius/radius';
import { spacing } from '@/design-system/spacing/spacing';
import { useTheme } from '@/design-system/theme';
import { typography } from '@/design-system/typography/typography';
import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { kindPresentation } from '@/scene/surface-objects/kindPresentation';

export type CreateObjectSheetProps = {
  readonly visible: boolean;
  readonly kind: SurfaceObjectKind | null;
  readonly note: string;
  readonly onChangeNote: (note: string) => void;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
};

const NOTE_LIMIT = 240;

/**
 * The cell is never asked for: placement belongs to the domain. The sheet only
 * collects the meaning of the moment.
 */
function CreateObjectSheetComponent({
  visible,
  kind,
  note,
  onChangeNote,
  onConfirm,
  onClose,
}: CreateObjectSheetProps): ReactElement | null {
  const { colors } = useTheme();

  if (kind === null) {
    return null;
  }

  const presentation = kindPresentation(kind);

  return (
    <Modal visible={visible} onClose={onClose} title={presentation.createLabel}>
      <Text variant="caption">
        Опишите момент — он останется в истории вместе с объектом. Место на поверхности выберется
        само.
      </Text>
      <View style={[styles.field, { backgroundColor: colors.surfaceSunken }]}>
        <TextInput
          value={note}
          onChangeText={onChangeNote}
          placeholder="Что произошло?"
          placeholderTextColor={colors.textTertiary}
          maxLength={NOTE_LIMIT}
          multiline
          style={[styles.input, { color: colors.textPrimary }]}
        />
      </View>
      <Button label={presentation.createLabel} onPress={onConfirm} />
    </Modal>
  );
}

export const CreateObjectSheet = memo(CreateObjectSheetComponent);

const styles = StyleSheet.create({
  field: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    ...typography.body,
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
