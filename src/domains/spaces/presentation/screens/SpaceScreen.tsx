import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { floatingChromeBottomInset } from '@/app/navigation/tabBarLayout';
import { useServices } from '@/app/providers/ContainerProvider';
import { useUiStore } from '@/app/stores/uiStore';
import { colors } from '@/design-system/colors/colors';
import { ActionBar, type ActionBarAction } from '@/design-system/components/ActionBar/ActionBar';
import { Text } from '@/design-system/components/Text/Text';
import { icons } from '@/design-system/icons/icons';
import { layout, spacing } from '@/design-system/spacing/spacing';
import { useAuthStore } from '@/domains/auth/presentation/stores/authStore';
import { useSurfaceObjectActions } from '@/domains/surface-objects/presentation/hooks/useSurfaceObjectActions';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { useSurface } from '@/domains/surfaces/presentation/hooks/useSurface';
import { useRealtimeSync } from '@/infrastructure/realtime/useRealtimeSync';
import { SceneView } from '@/scene/SceneView';
import { presentableKinds } from '@/scene/surface-objects/kindPresentation';

import { hasPermission } from '../../domain/services/permissionService';
import { CreateObjectSheet } from '../components/CreateObjectSheet';
import { ObjectDetailsSheet } from '../components/ObjectDetailsSheet';
import { SpaceHeader } from '../components/SpaceHeader';
import { useSpaces } from '../hooks/useSpaces';

/**
 * The scene is the screen. Everything else floats above it, so the surface is
 * never pushed out of view by chrome.
 */
export function SpaceScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { logger } = useServices();

  const { activeSpace, isLoading: spacesLoading } = useSpaces();
  const spaceId = activeSpace?.id ?? null;
  const { surface, isLoading: surfaceLoading } = useSurface(spaceId);
  const actions = useSurfaceObjectActions(spaceId);

  useRealtimeSync(spaceId);

  const currentUserId = useAuthStore((state) => state.session?.userId ?? null);
  const selectedId = useSurfaceObjectsStore((state) => state.selectedId);
  const selected = useSurfaceObjectsStore((state) =>
    state.selectedId === null ? null : (state.byId[state.selectedId] ?? null),
  );
  const select = useSurfaceObjectsStore((state) => state.select);
  const sheet = useUiStore((state) => state.sheet);
  const openSheet = useUiStore((state) => state.openSheet);
  const closeSheet = useUiStore((state) => state.closeSheet);

  const [note, setNote] = useState('');

  const canCreate =
    activeSpace !== null &&
    currentUserId !== null &&
    hasPermission(activeSpace, currentUserId, 'surfaceObject.create');

  const barActions = useMemo<readonly ActionBarAction[]>(
    () =>
      presentableKinds().map((presentation) => ({
        id: presentation.kind,
        label: presentation.createLabel,
        icon: presentation.icon,
        tint: presentation.tint,
        disabled: !canCreate || actions.isCreating,
        onPress: () => {
          setNote('');
          openSheet({ type: 'createObject', kind: presentation.kind });
        },
      })),
    [canCreate, actions.isCreating, openSheet],
  );

  const confirmCreate = useCallback(() => {
    if (sheet.type !== 'createObject') {
      return;
    }

    actions.create(sheet.kind, note.trim());
    closeSheet();
  }, [sheet, actions, note, closeSheet]);

  const isBusy = spacesLoading || (surfaceLoading && surface === null);

  return (
    <View style={styles.root}>
      <View style={styles.scene}>
        <SceneView bounds={surface?.bounds ?? null} logger={logger} spaceKey={spaceId} />
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <SpaceHeader space={activeSpace} />
      </View>

      {isBusy ? (
        <View pointerEvents="none" style={styles.loader}>
          <ActivityIndicator color={colors.textSecondary} size="large" />
        </View>
      ) : null}

      {!canCreate && activeSpace !== null ? (
        <View
          pointerEvents="none"
          style={[
            styles.notice,
            {
              bottom:
                floatingChromeBottomInset(insets.bottom) + layout.actionBarHeight + spacing.md,
            },
          ]}
        >
          <Text variant="caption" align="center">
            У вас нет прав добавлять объекты в это пространство
          </Text>
        </View>
      ) : null}

      <View
        pointerEvents="box-none"
        style={[
          styles.actionBar,
          {
            bottom: floatingChromeBottomInset(insets.bottom),
          },
        ]}
      >
        <ActionBar actions={barActions} />
      </View>

      <CreateObjectSheet
        visible={sheet.type === 'createObject'}
        kind={sheet.type === 'createObject' ? sheet.kind : null}
        note={note}
        onChangeNote={setNote}
        onConfirm={confirmCreate}
        onClose={closeSheet}
      />

      <ObjectDetailsSheet
        object={selected}
        visible={selectedId !== null}
        icon={icons.favorite}
        onClose={() => select(null)}
        onSoften={actions.soften}
        onToggleFavorite={actions.toggleFavorite}
        onDelete={(object) => {
          actions.remove(object);
          select(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scene: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    left: layout.screenGutter,
    right: layout.screenGutter,
    top: 0,
  },
  actionBar: {
    position: 'absolute',
    left: layout.screenGutter,
    right: layout.screenGutter,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    position: 'absolute',
    left: layout.screenGutter,
    right: layout.screenGutter,
  },
});
