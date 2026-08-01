import type { IconName } from '@/design-system/icons/icons';
import { icons } from '@/design-system/icons/icons';

export type TabRouteName = 'index' | 'timeline' | 'ai' | 'profile';

export type TabGlyphs = { readonly active: IconName; readonly inactive: IconName };

export type TabRouteConfig = {
  readonly name: TabRouteName;
  readonly title: string;
  readonly glyphs: TabGlyphs;
};

export const TAB_ROUTES: readonly TabRouteConfig[] = [
  {
    name: 'index',
    title: 'Пространство',
    glyphs: { active: icons.spaceActive, inactive: icons.space },
  },
  {
    name: 'timeline',
    title: 'История',
    glyphs: { active: icons.timelineActive, inactive: icons.timeline },
  },
  { name: 'ai', title: 'AI', glyphs: { active: icons.aiActive, inactive: icons.ai } },
  {
    name: 'profile',
    title: 'Профиль',
    glyphs: { active: icons.profileActive, inactive: icons.profile },
  },
];

const TAB_ICONS = Object.fromEntries(
  TAB_ROUTES.map((route) => [route.name, route.glyphs]),
) as Readonly<Record<string, TabGlyphs>>;

const FALLBACK_GLYPHS: TabGlyphs = { active: 'ellipse', inactive: 'ellipse-outline' };

export function getTabGlyphs(routeName: string): TabGlyphs {
  return TAB_ICONS[routeName] ?? FALLBACK_GLYPHS;
}
