import type { ReactElement } from 'react';
import { View } from 'react-native';
import { useServices } from '@/app/providers/ContainerProvider';
import { useUiStore } from '@/app/stores/uiStore';
import { BlurCard } from '@/design-system/components/BlurCard/BlurCard';
import { Button } from '@/design-system/components/Button/Button';
import { Divider } from '@/design-system/components/Divider/Divider';
import { ListRow } from '@/design-system/components/ListRow/ListRow';
import { Screen } from '@/design-system/components/Screen/Screen';
import { Text } from '@/design-system/components/Text/Text';
import { icons } from '@/design-system/icons/icons';

import { entitlementKeys, freeEntitlements } from '../../domain/entities/Entitlements';

const ENTITLEMENT_COPY = {
  canUseAI: { title: 'Наблюдения', subtitle: 'Разбор истории пространства' },
  canCreateMultipleSpaces: { title: 'Несколько пространств', subtitle: 'Личные и общие' },
  canExportTimeline: { title: 'Экспорт истории', subtitle: 'Сохранить моменты себе' },
  canUploadVoice: { title: 'Голосовые заметки', subtitle: 'Записывать момент голосом' },
} as const;

export function BillingScreen(): ReactElement {
  const { isSandbox } = useServices();
  const showToast = useUiStore((state) => state.showToast);

  return (
    <Screen title="Доступ" reserveTabBar={false}>
      <BlurCard title="Что открывается">
        {entitlementKeys.map((key, index) => (
          <View key={key}>
            {index === 0 ? null : <Divider />}
            <ListRow
              title={ENTITLEMENT_COPY[key].title}
              subtitle={ENTITLEMENT_COPY[key].subtitle}
              icon={freeEntitlements[key] ? icons.synced : icons.billing}
            />
          </View>
        ))}
      </BlurCard>

      <Button
        label="Оформить доступ"
        onPress={() => {
          showToast(
            isSandbox ? 'Покупки недоступны в офлайн-режиме' : 'Покупка откроется в системном окне',
          );
        }}
      />

      <Text variant="caption" align="center">
        Покупки проходят через App Store и Google Play. Доступ привязан к аккаунту, а не к
        устройству.
      </Text>
    </Screen>
  );
}
