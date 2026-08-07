import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/design-system/components/Button/Button';
import { Divider } from '@/design-system/components/Divider/Divider';
import { ListRow } from '@/design-system/components/ListRow/ListRow';
import { Modal } from '@/design-system/components/Modal/Modal';
import { Text } from '@/design-system/components/Text/Text';
import { icons } from '@/design-system/icons/icons';
import { spacing } from '@/design-system/spacing/spacing';
import { useTheme } from '@/design-system/theme';
import type { SurfaceObject } from '@/domains/surface-objects/domain/entities/SurfaceObject';
import { availableTransitions } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectState';
import { kindPresentation } from '@/scene/surface-objects/kindPresentation';

export type ObjectDetailsSheetProps = {
  readonly object: SurfaceObject | null;
  readonly visible: boolean;
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

/**
 * Tall by design: the sheet claims the lower half of the screen and the camera
 * reframes the object into the strip above it, so the thing being discussed
 * stays visible while you act on it.
 */
function ObjectDetailsSheetComponent({
  object,
  visible,
  onClose,
  onSoften,
  onToggleFavorite,
  onDelete,
}: ObjectDetailsSheetProps): ReactElement | null {
  const { colors } = useTheme();

  if (object === null) {
    return null;
  }

  const presentation = kindPresentation(object.kind);
  const note = noteOf(object);
  const canSoften = availableTransitions(object.state).includes('soften');

  return (
    <Modal visible={visible} onClose={onClose} title={presentation.title} size="tall">
      <View style={styles.meta}>
        <Text variant="caption">
          {STATE_LABELS[object.state]} · ячейка {object.cell.x}, {object.cell.y}
        </Text>
        {note === null ? null : <Text variant="body">{note}</Text>}
      </View>

      <Button
        label={object.favorite ? 'В избранном' : 'Добавить в избранное'}
        variant={object.favorite ? 'secondary' : 'primary'}
        onPress={() => onToggleFavorite(object)}
      />

      <Divider />

      {canSoften ? (
        <ListRow
          title="Смягчить"
          subtitle="Объект начнёт затухать"
          icon={icons.soften}
          onPress={() => onSoften(object)}
        />
      ) : null}

      <ListRow
        title="Убрать с поверхности"
        icon={icons.trash}
        iconTint={colors.negative}
        onPress={() => onDelete(object)}
      />
    </Modal>
  );
}

export const ObjectDetailsSheet = memo(ObjectDetailsSheetComponent);

const styles = StyleSheet.create({
  meta: {
    gap: spacing.sm,
  },
});
