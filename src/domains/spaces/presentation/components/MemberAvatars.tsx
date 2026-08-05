import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, palette } from '@/design-system/colors/colors';
import { Text } from '@/design-system/components/Text/Text';
import {
  selectSurfaceBackground,
  useSettingsStore,
} from '@/domains/settings/presentation/stores/settingsStore';

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
  palette.slate500,
  palette.moss500,
  palette.crimson500,
  palette.ink600,
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
};

function Avatar({ member, ringColor }: AvatarProps): ReactElement {
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
      <Text variant="captionStrong" color={colors.textInverted}>
        {initial(member.displayName)}
      </Text>
    </View>
  );
}

/**
 * Участники пространства в правом верхнем углу сцены: сначала ты, потом второй.
 * Обводка левой аватарки повторяет фон поверхности, поэтому нахлёст читается
 * даже когда фон сменили на тёмный.
 */
function MemberAvatarsComponent({ space, currentUserId }: MemberAvatarsProps): ReactElement | null {
  const background = useSettingsStore(selectSurfaceBackground);

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
      <Avatar member={me} ringColor={partner === null ? null : background} />
      {partner === null ? null : <Avatar member={partner} ringColor={null} />}
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
