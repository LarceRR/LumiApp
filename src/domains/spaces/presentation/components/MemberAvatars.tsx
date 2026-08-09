import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColorSchemeToken } from '@/design-system/colors/colors';
import { UserAvatar } from '@/design-system/components/UserAvatar/UserAvatar';
import { useAuthStore } from '@/domains/auth/presentation/stores/authStore';
import {
  selectSurfaceBackground,
  useSettingsStore,
} from '@/domains/settings/presentation/stores/settingsStore';
import { resolveSurfaceBackground } from '@/scene/surface/surfaceTheme';

import type { Space } from '../../domain/entities/Space';

export type MemberAvatarsProps = {
  readonly space: Space | null;
  readonly currentUserId: string | null;
};

/** 4pt smaller than before: the top row now sits alone and can read lighter. */
const AVATAR_SIZE = 36;
/** Насколько левая аватарка заходит на правую. */
const OVERLAP = 8;

/**
 * Участники пространства сверху: сначала ты, потом второй.
 * Обводка левой аватарки повторяет фон поверхности, поэтому нахлёст читается
 * в любой теме.
 *
 * `SpaceMember` не носит фотографию, поэтому снимок есть только у текущего
 * пользователя — у партнёра остаётся буква, и это честно, а не заглушка.
 */
function MemberAvatarsComponent({ space, currentUserId }: MemberAvatarsProps): ReactElement | null {
  const scheme = useColorSchemeToken();
  const myAvatarUrl = useAuthStore((state) => state.profile?.avatarUrl ?? null);
  const background = resolveSurfaceBackground(useSettingsStore(selectSurfaceBackground), scheme);

  if (space === null || space.members.length === 0) {
    return null;
  }

  const me = space.members.find((member) => member.userId === currentUserId) ?? space.members[0];

  if (me === undefined) {
    return null;
  }

  const partner = space.members.find((member) => member.userId !== me.userId) ?? null;
  const myPhoto = me.userId === currentUserId ? myAvatarUrl : null;

  return (
    <View accessibilityLabel="Участники пространства" style={styles.row}>
      <View style={partner === null ? null : styles.overlapped}>
        <UserAvatar
          name={me.displayName}
          imageUri={myPhoto}
          seed={me.userId}
          size={AVATAR_SIZE}
          ringColor={partner === null ? null : background}
        />
      </View>
      {partner === null ? null : (
        <UserAvatar name={partner.displayName} seed={partner.userId} size={AVATAR_SIZE} />
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
  overlapped: {
    zIndex: 1,
    marginRight: -OVERLAP,
  },
});
