import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { floatingChromeBottomInset } from '@/app/navigation/tabBarLayout';
import { useServices } from '@/app/providers/ContainerProvider';
import { useUiStore } from '@/app/stores/uiStore';
import { useThemeColors } from '@/design-system/colors/colors';
import { FloatingAddButton } from '@/design-system/components/FloatingAddButton/FloatingAddButton';
import { Text } from '@/design-system/components/Text/Text';
import { icons } from '@/design-system/icons/icons';
import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import { layout, spacing } from '@/design-system/spacing/spacing';
import { useAuthStore } from '@/domains/auth/presentation/stores/authStore';
import { useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';
import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { useSurfaceObjectActions } from '@/domains/surface-objects/presentation/hooks/useSurfaceObjectActions';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { useSurface } from '@/domains/surfaces/presentation/hooks/useSurface';
import { selectIsSyncing, useRealtimeStore } from '@/infrastructure/realtime/realtimeStore';
import { useRealtimeSync } from '@/infrastructure/realtime/useRealtimeSync';
import { ModelHitboxOverlay } from '@/scene/overlays/ModelHitboxOverlay';
import { SceneView } from '@/scene/SceneView';
import { useCameraStore } from '@/scene/stores/cameraStore';
import { useHitboxStore } from '@/scene/stores/hitboxStore';
import { selectFps, useSceneStore } from '@/scene/stores/sceneStore';
import { presentableKinds } from '@/scene/surface-objects/kindPresentation';

import { hasPermission } from '../../domain/services/permissionService';
import { AddObjectMenu, type AddObjectOption } from '../components/AddObjectMenu';
import { CreateObjectSheet } from '../components/CreateObjectSheet';
import { MemberAvatars } from '../components/MemberAvatars';
import { ObjectDetailsSheet } from '../components/ObjectDetailsSheet';
import { useSpaces } from '../hooks/useSpaces';

/**
 * The + control now sits under the thumb rather than in the top corner, so it
 * is bigger: 64pt reads as the primary action instead of a fourth icon.
 */
const ADD_BUTTON_SIZE = 64;
/** Height the top row reserves, matching the avatars that live there. */
const TOP_SLOT_HEIGHT = 36;

/**
 * The scene is the screen. Everything else floats above it, so the surface is
 * never pushed out of view by chrome.
 *
 * Top row: diagnostics on the left, the people in this space on the right. The
 * single way to add something now floats in the centre above the tab bar, where
 * a primary action belongs on a phone.
 */
export function SpaceScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
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
  const endInspect = useCameraStore((state) => state.endInspect);
  const clearHitbox = useHitboxStore((state) => state.clear);
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

  const addOptions = useMemo<readonly AddObjectOption[]>(
    () =>
      presentableKinds().map((presentation) => ({
        kind: presentation.kind,
        label: presentation.createLabel,
        icon: presentation.icon,
        tint: presentation.tint,
      })),
    [],
  );

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

  // Closing the sheet also gives the camera its framing back: the look-at point
  // lifts off the sheet offset and the distance eases out. The debug hitbox goes
  // with it — it described a selection that no longer exists.
  const dismissDetails = useCallback(() => {
    select(null);
    endInspect();
    clearHitbox();
  }, [clearHitbox, endInspect, select]);

  const isBusy = spacesLoading || (surfaceLoading && surface === null);
  const topBarTop = insets.top + spacing.sm;
  const addButtonBottom = floatingChromeBottomInset(insets.bottom) + spacing.sm;

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <View style={styles.scene}>
        <SceneView bounds={surface?.bounds ?? null} logger={logger} spaceKey={spaceId} />
      </View>

      <ModelHitboxOverlay />

      {menuOpen ? (
        <Pressable
          accessibilityLabel="Закрыть меню добавления"
          style={StyleSheet.absoluteFill}
          onPress={() => setMenuOpen(false)}
        />
      ) : null}

      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: topBarTop }]}>
        <View pointerEvents="none" style={styles.topSlot}>
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

        <View pointerEvents="box-none" style={[styles.topSlot, styles.topRight]}>
          <MemberAvatars space={activeSpace} currentUserId={currentUserId} />
        </View>
      </View>

      {menuOpen ? (
        <AddObjectMenu
          options={addOptions}
          onSelect={startCreate}
          bottom={addButtonBottom + ADD_BUTTON_SIZE + spacing.sm}
        />
      ) : null}

      <View pointerEvents="box-none" style={[styles.addSlot, { bottom: addButtonBottom }]}>
        <FloatingAddButton
          accessibilityLabel={menuOpen ? 'Закрыть меню добавления' : 'Добавить объект'}
          expanded={menuOpen}
          disabled={!canCreate || actions.isCreating}
          size={ADD_BUTTON_SIZE}
          onPress={() => setMenuOpen((open) => !open)}
        />
      </View>

      {isBusy ? (
        <View pointerEvents="none" style={styles.loader}>
          <ActivityIndicator color={theme.textSecondary} size="large" />
        </View>
      ) : null}

      {!canCreate && activeSpace !== null ? (
        <View
          pointerEvents="none"
          style={[styles.notice, { bottom: addButtonBottom + ADD_BUTTON_SIZE + spacing.md }]}
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
        icon={icons.favorite}
        heightFraction={surfaceObjectMotion.inspect.sheetScreenFraction}
        onClose={dismissDetails}
        onSoften={actions.soften}
        onToggleFavorite={actions.toggleFavorite}
        onDelete={(object) => {
          actions.remove(object);
          dismissDetails();
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
    alignItems: 'center',
    gap: spacing.md,
  },
  topSlot: {
    flex: 1,
    minHeight: TOP_SLOT_HEIGHT,
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  topRight: {
    alignItems: 'flex-end',
  },
  addSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
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
