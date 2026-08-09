import { memo, type ReactElement, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { palette } from '../../colors/colors';
import { useThemeColors } from '../../colors/themeStore';
import { Text } from '../Text/Text';

export type UserAvatarProps = {
  readonly name: string;
  /** Photo to show. Falling back to the initial is the normal case, not an error. */
  readonly imageUri?: string | null;
  readonly size?: number;
  /**
   * Stable colour seed. Pass a user id so the same person keeps the same circle
   * even when their display name changes.
   */
  readonly seed?: string;
  readonly ringColor?: string | null;
  readonly ringWidth?: number;
  readonly accessibilityLabel?: string;
};

const DEFAULT_SIZE = 40;
const DEFAULT_RING_WIDTH = 2;

const TINTS = [
  palette.ember500,
  palette.damson500,
  palette.verdigris500,
  palette.slate500,
  palette.basalt600,
] as const;

export function avatarInitial(name: string): string {
  const trimmed = name.trim();

  return trimmed.length === 0 ? '?' : trimmed.slice(0, 1).toUpperCase();
}

/** Colour is bound to the seed, not to render order: one person, one circle. */
export function avatarTint(seed: string): string {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 2_147_483_647;
  }

  return TINTS[hash % TINTS.length] ?? TINTS[0];
}

/**
 * One avatar for the whole app.
 *
 * A broken or slow image URL degrades to the initial rather than to an empty
 * hole, because an avatar that sometimes renders nothing is worse than one that
 * never renders a photo.
 */
function UserAvatarComponent({
  name,
  imageUri = null,
  size = DEFAULT_SIZE,
  seed,
  ringColor = null,
  ringWidth = DEFAULT_RING_WIDTH,
  accessibilityLabel,
}: UserAvatarProps): ReactElement {
  const theme = useThemeColors();
  const [failed, setFailed] = useState(false);

  // A new URL deserves a fresh attempt; otherwise one bad photo poisons the
  // component for the rest of its life.
  useEffect(() => {
    setFailed(false);
  }, [imageUri]);

  const showsImage = imageUri !== null && imageUri.length > 0 && !failed;
  const circle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: avatarTint(seed ?? name),
  };
  const ring = ringColor === null ? null : { borderWidth: ringWidth, borderColor: ringColor };

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? name}
      accessible
      style={[styles.root, circle, ring]}
    >
      {showsImage ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: imageUri }}
          onError={() => setFailed(true)}
          style={{ width: size, height: size }}
        />
      ) : (
        <Text
          variant="captionStrong"
          color={theme.accentOn}
          style={{ fontSize: Math.round(size * 0.4), lineHeight: Math.round(size * 0.5) }}
        >
          {avatarInitial(name)}
        </Text>
      )}
    </View>
  );
}

export const UserAvatar = memo(UserAvatarComponent);

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
