import { type ReactElement, useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { floatingChromeBottomInset } from '@/app/navigation/tabBarLayout';
import { useServices } from '@/app/providers/ContainerProvider';
import { useUiStore } from '@/app/stores/uiStore';
import {
  GLASS_BUTTON_SIZE,
  GlassIconButton,
} from '@/design-system/components/GlassIconButton/GlassIconButton';
import { Text } from '@/design-system/components/Text/Text';
import { icons } from '@/design-system/icons/icons';
import { layout, spacing } from '@/design-system/spacing/spacing';
import { useTheme } from '@/design-system/theme';
import { useAuthStore } from '@/domains/auth/presentation/stores/authStore';
import { useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';
import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { useSurfaceObjectActions } from '@/domains/surface-objects/presentation/hooks/useSurfaceObjectActions';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { useSurface } from '@/domains/surfaces/presentation/hooks/useSurface';
import { selectIsSyncing, useRealtimeStore } from '@/infrastructure/realtime/realtimeStore';
import { useRealtimeSync } from '@/infrastructure/realtime/useRealtimeSync';
import { SceneView } from '@/scene/SceneView';
import { selectFps, useSceneStore } from '@/scene/stores/sceneStore';

import { hasPermission } from '../../domain/services/permissionService';
import { AddObjectMenu } from '../components/AddObjectMenu';
import { CreateObjectSheet } from '../components/CreateObjectSheet';
import { MemberAvatars } from '../components/MemberAvatars';
import { ObjectDetailsSheet } from '../components/ObjectDetailsSheet';
import { useSpaces } from '../hooks/useSpaces';

/**
 * The scene is the screen. Chrome floats above it and is kept to a single row
 * at the top, so the surface owns the frame instead of being squeezed between
 * an action bar and a tab bar.
 */
export function SpaceScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { logger } = useServices();
  const { colors } = useTheme();

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

  const isSyncing = useRealtimeStore(selectIsSyncing);
  const showOverlay = useSettingsStore((state) => state.showPerformanceOverlay);
  const fps = useSceneStore(selectFps);

  const [note, setNote] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const canCreate =
    activeSpace !== null &&
    currentUserId !== null &&
    hasPermission(activeSpace, currentUserId, 'surfaceObject.create');

  const topRowTop = insets.top + spacing.sm;

  const startCreate = useCallback(
    (kind: SurfaceObjectKind) => {
      setMenuOpen(false);
      setNote('');
      openSheet({ type: 'createObject', kind });
    },
    [openSheet],
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
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <View style={styles.scene}>
        <SceneView bounds={surface?.bounds ?? null} logger={logger} spaceKey={spaceId} />
      </View>

      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: topRowTop }]}>
        <View pointerEvents="none" style={styles.side}>
          {showOverlay ? (
            <Text variant="caption" numberOfLines={1}>
              {`${fps} fps`}
            </Text>
          ) : null}
          {isSyncing ? (
            <Text variant="caption" numberOfLines={1}>
              Синхронизация
            </Text>
          ) : null}
        </View>

        <View pointerEvents="box-none" style={styles.center}>
          <MemberAvatars space={activeSpace} currentUserId={currentUserId} />
        </View>

        <View pointerEvents="box-none" style={styles.sideEnd}>
          <GlassIconButton
            icon={icons.add}
            accessibilityLabel="Добавить объект"
            disabled={!canCreate || actions.isCreating}
            onPress={() => {
              setMenuOpen((open) => !open);
            }}
          />
        </View>
      </View>

      <AddObjectMenu
        visible={menuOpen}
        disabled={!canCreate || actions.isCreating}
        anchorTop={topRowTop + GLASS_BUTTON_SIZE + spacing.sm}
        onSelect={startCreate}
        onDismiss={() => {
          setMenuOpen(false);
        }}
      />

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
            { bottom: floatingChromeBottomInset(insets.bottom) + spacing.md },
          ]}
        >
          <Text variant="caption" align="center">
            У вас нет прав добавлять объекты в это пространство
          </Text>
        </View>
      ) : null}

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
  },
  scene: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    left: layout.screenGutter,
    right: layout.screenGutter,
    top: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  side: {
    flex: 1,
    gap: spacing.xxs,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  sideEnd: {
    flex: 1,
    alignItems: 'flex-end',
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
