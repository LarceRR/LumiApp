import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Single place where product concepts map to glyphs. */
export const icons = {
  space: 'planet-outline',
  spaceActive: 'planet',
  timeline: 'time-outline',
  timelineActive: 'time',
  ai: 'sparkles-outline',
  aiActive: 'sparkles',
  profile: 'person-outline',
  profileActive: 'person',
  fire: 'flame',
  cloud: 'cloud',
  add: 'add',
  settings: 'settings-outline',
  appearance: 'contrast-outline',
  motion: 'move-outline',
  scene: 'cube-outline',
  developer: 'speedometer-outline',
  billing: 'card-outline',
  close: 'close',
  chevronRight: 'chevron-forward',
  favorite: 'heart',
  favoriteOutline: 'heart-outline',
  soften: 'water-outline',
  trash: 'trash-outline',
  reset: 'scan-outline',
  offline: 'cloud-offline-outline',
  synced: 'checkmark-circle-outline',
} as const satisfies Readonly<Record<string, IconName>>;

export type IconToken = keyof typeof icons;
