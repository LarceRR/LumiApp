import { useRouter } from 'expo-router';
import { type ReactElement, useMemo } from 'react';
import { isEnabled } from '@/app/config/featureFlags';
import { BlurCard } from '@/design-system/components/BlurCard/BlurCard';
import { Button } from '@/design-system/components/Button/Button';
import { EmptyState } from '@/design-system/components/EmptyState/EmptyState';
import { Screen } from '@/design-system/components/Screen/Screen';
import { Text } from '@/design-system/components/Text/Text';
import { icons } from '@/design-system/icons/icons';
import { useSpaces } from '@/domains/spaces/presentation/hooks/useSpaces';
import { knownKinds } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';

/**
 * Insights are gated by entitlements, never by a plan name. Until the billing
 * module reports the entitlement, the screen offers the upgrade path instead of
 * pretending the feature is unavailable.
 */
export function AiScreen(): ReactElement {
  const router = useRouter();
  const { activeSpace } = useSpaces();
  const byId = useSurfaceObjectsStore((state) => state.byId);
  const order = useSurfaceObjectsStore((state) => state.order);

  const balance = useMemo(() => {
    let fire = 0;
    let cloud = 0;

    for (const id of order) {
      const object = byId[id];

      if (object === undefined) {
        continue;
      }

      if (object.kind === knownKinds.fire) {
        fire += 1;
      } else if (object.kind === knownKinds.cloud) {
        cloud += 1;
      }
    }

    return { fire, cloud, total: fire + cloud };
  }, [byId, order]);

  if (!isEnabled('ai')) {
    return (
      <Screen title="AI">
        <EmptyState
          icon={icons.ai}
          title="Скоро"
          description="Раздел с наблюдениями появится в одном из следующих обновлений."
        />
      </Screen>
    );
  }

  return (
    <Screen title="AI" subtitle={activeSpace?.title ?? 'Пространство не выбрано'}>
      <BlurCard title="Что видно на поверхности">
        {balance.total === 0 ? (
          <Text variant="body">
            Пока пусто. Отметьте первый момент — и здесь появится наблюдение.
          </Text>
        ) : (
          <Text variant="body">
            Огоньков: {balance.fire}, облаков: {balance.cloud}. Наблюдения строятся по истории
            пространства и учитывают, кто и на что реагировал.
          </Text>
        )}
      </BlurCard>

      <BlurCard title="Доступ">
        <Text variant="caption">
          Наблюдения входят в расширенный доступ. Он открывает разбор истории, экспорт и голосовые
          заметки.
        </Text>
        <Button
          label="Посмотреть доступ"
          variant="secondary"
          onPress={() => router.push('/billing')}
        />
      </BlurCard>
    </Screen>
  );
}
