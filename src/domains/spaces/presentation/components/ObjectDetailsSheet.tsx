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
import { useInspectStore } from '@/scene/stores/inspectStore';
import { kindPresentation } from '@/scene/surface-objects/kindPresentation';
export type ObjectDetailsSheetProps = {
  readonly object: SurfaceObject | null;
  readonly visible: boolean;
  readonly icon: IconName;
  readonly heightFraction?: number;
  readonly onClose: () => void;
  readonly onToggleFavorite: (object: SurfaceObject) => void;
  readonly onDelete: (object: SurfaceObject) => void;
};
function noteOf(object: SurfaceObject): string | null {
  const note = object.metadata.note;
  return typeof note === 'string' && note.length > 0 ? note : null;
}
function ObjectDetailsSheetComponent({
  object,
  visible,
  heightFraction,
  onClose,
  onToggleFavorite,
  onDelete,
}: ObjectDetailsSheetProps): ReactElement | null {
  const theme = useThemeColors();
  const setSheetHeight = useInspectStore((s) => s.setSheetHeight);
  if (object === null) return null;
  const presentation = kindPresentation(object.kind);
  const note = noteOf(object);
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      {...(heightFraction === undefined ? {} : { heightFraction })}
      onSheetLayout={setSheetHeight}
    >
      <Text variant="sectionTitle">{presentation.title}</Text>
      <View style={styles.meta}>
        <Text variant="caption">{`Активен · ячейка ${object.cell.x}, ${object.cell.y}`}</Text>
        {note === null ? null : <Text variant="body">{note}</Text>}
      </View>
      <Divider />
      <ListRow
        title={object.favorite ? 'В избранном' : 'Добавить в избранное'}
        icon={object.favorite ? icons.favorite : icons.favoriteOutline}
        iconTint={object.favorite ? theme.accent : theme.textSecondary}
        onPress={() => onToggleFavorite(object)}
      />
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
