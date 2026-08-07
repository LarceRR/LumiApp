import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { palette, useColorSchemeToken, useThemeColors } from '@/design-system/colors/colors';
import { Text } from '@/design-system/components/Text/Text';
import {
  selectSurfaceBackground,
  useSettingsStore,
} from '@/domains/settings/presentation/stores/settingsStore';
import { resolveSurfaceBackground } from '@/scene/surface/surfaceTheme';

import type { Space, SpaceMember } from '../../domain/entities/Space';

export type MemberAvatarsProps = {
  readonly space: Space | null;
  readonly currentUserId: string | null;
};

const AVATAR_SIZE = 32;
/** Насколько левая аватарка заходит на правую. */
const OVERLAP = 8;
const RING_WIDTH = 2;

const TINTS = [
  palette.ember500,
  palette.damson500,
  palette.verdigris500,
  palette.slate500,
  palette.basalt600,
] as const;

function initial(name: string): string {
  const trimmed = name.trim();

  return trimmed.length === 0 ? '?' : trimmed.slice(0, 1).toUpperCase();
}

/** Цвет привязан к id, а не к порядку: один и тот же человек — один и тот же кружок. */
function tintFor(seed: string): string {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 2_147_483_647;
  }

  return TINTS[hash % TINTS.length] ?? TINTS[0];
}

type AvatarProps = {
  readonly member: SpaceMember;
  readonly ringColor: string | null;
  readonly labelColor: string;
};

function Avatar({ member, ringColor, labelColor }: AvatarProps): ReactElement {
  return (
    <View
      accessibilityLabel={member.displayName}
      style={[
        styles.avatar,
        { backgroundColor: tintFor(member.userId) },
        ringColor === null
          ? null
          : { borderWidth: RING_WIDTH, borderColor: ringColor, zIndex: 1, marginRight: -OVERLAP },
      ]}
    >
      <Text variant="captionStrong" color={labelColor}>
        {initial(member.displayName)}
      </Text>
    </View>
  );
}

/**
 * Участники пространства по центру сверху: сначала ты, потом второй.
 * Обводка левой аватарки повторяет фон поверхности, поэтому нахлёст читается
 * в любой теме.
 */
function MemberAvatarsComponent({ space, currentUserId }: MemberAvatarsProps): ReactElement | null {
  const scheme = useColorSchemeToken();
  const theme = useThemeColors();
  const background = resolveSurfaceBackground(useSettingsStore(selectSurfaceBackground), scheme);

  if (space === null || space.members.length === 0) {
    return null;
  }

  const me = space.members.find((member) => member.userId === currentUserId) ?? space.members[0];

  if (me === undefined) {
    return null;
  }

  const partner = space.members.find((member) => member.userId !== me.userId) ?? null;

  return (
    <View accessibilityLabel="Участники пространства" style={styles.row}>
      <Avatar
        member={me}
        ringColor={partner === null ? null : background}
        labelColor={theme.accentOn}
      />
      {partner === null ? null : (
        <Avatar member={partner} ringColor={null} labelColor={theme.accentOn} />
      )}
    </View>
  );
}

export const MemberAvatars = memo(MemberAvatarsComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
