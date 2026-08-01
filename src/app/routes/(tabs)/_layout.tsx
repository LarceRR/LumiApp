import type { ReactElement } from 'react';

import { FallbackTabsLayout } from '@/app/navigation/FallbackTabsLayout';
import { NativeTabsLayout } from '@/app/navigation/NativeTabsLayout';
import { usesNativeTabBar } from '@/app/navigation/usesNativeTabBar';

export default function TabsLayout(): ReactElement {
  return usesNativeTabBar() ? <NativeTabsLayout /> : <FallbackTabsLayout />;
}
