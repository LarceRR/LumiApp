import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/design-system/colors/colors';
import { Button } from '@/design-system/components/Button/Button';
import { BottomSheet } from '@/design-system/components/BottomSheet/BottomSheet';
import { Divider } from '@/design-system/components/Divider/Divider';
import { ListRow } from '@/design-system/components/ListRow/ListRow';
import { Text } from '@/design-system/components/Text/Text';
import { icons, type IconName } from '@/design-system/icons/icons';
import { spacing } from '@/design-system/spacing/spacing';
import type { SurfaceObject } from '@/domains/surface-objects/domain/entities/SurfaceObject';
import { availableTransitions } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectState';
import { useInspectStore } from '@/scene/stores/inspectStore';
import { kindPresentation } from '@/scene/surface-objects/kindPresentation';

export type ObjectDetailsSheetProps = {
  readonly object: SurfaceObject | null;
  readonly visible: boolean;
  readonly icon: IconName;
  readonly heightFraction?: number;
  readonly onClose: () => void;
  readonly onSoften: (object: SurfaceObject) => void;
  readonly onToggleFavorite: (object: SurfaceObject) => void;
  readonly onDelete: (object: SurfaceObject) => void;
};
const STATE_LABELS = {
  Emerging: 'Появляется',
  Active: 'Активен',
  Fading: 'Смягчается',
  Settled: 'Осел',
} as const;

function noteOf(object: SurfaceObject): string | null {
  const note = object.metadata.note;
  return typeof note === 'string' && note.length > 0 ? note : null;
}

function ObjectDetailsSheetComponent({
  object,
  visible,
  heightFraction,
  onClose,
  onSoften,
  onToggleFavorite,
  onDelete,
}: ObjectDetailsSheetProps): ReactElement | null {
  const theme = useThemeColors();
  const setSheetHeight = useInspectStore((state) => state.setSheetHeight);
  if (object === null) return null;
  const presentation = kindPresentation(object.kind);
  const note = noteOf(object);
  const canSoften = availableTransitions(object.state).includes('soften');
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      {...(heightFraction !== undefined ? { heightFraction } : {})}
      onSheetLayout={setSheetHeight}
    >
      <Text variant="sectionTitle">{presentation.title}</Text>
      <View style={styles.meta}>
        <Text variant="caption">
          {STATE_LABELS[object.state]} · ячейка {object.cell.x}, {object.cell.y}
        </Text>
        {note === null ? null : <Text variant="body">{note}</Text>}
      </View>
      <Divider />
      <ListRow
        title={object.favorite ? 'В избранном' : 'Добавить в избранное'}
        icon={object.favorite ? icons.favorite : icons.favoriteOutline}
        iconTint={object.favorite ? theme.accent : theme.textSecondary}
        onPress={() => onToggleFavorite(object)}
      />
      {canSoften ? (
        <ListRow
          title="Смягчить"
          subtitle="Объект начнёт затухать"
          icon={icons.soften}
          onPress={() => onSoften(object)}
        />
      ) : null}
      <View style={styles.spacer} />
      <Button label="Убрать с поверхности" variant="danger" onPress={() => onDelete(object)} />
    </BottomSheet>
  );
}
export const ObjectDetailsSheet = memo(ObjectDetailsSheetComponent);
const styles = StyleSheet.create({
  meta: { gap: spacing.sm },
  spacer: { flex: 1, minHeight: spacing.md },
});
