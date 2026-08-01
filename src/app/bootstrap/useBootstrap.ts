import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { useAuthStore } from '@/domains/auth/presentation/stores/authStore';
import {
  type PersistedSettings,
  persistedSettings,
  useSettingsStore,
} from '@/domains/settings/presentation/stores/settingsStore';
import { toAppError } from '@/shared/errors';

import { storageKeys } from '../config/constants';
import { loadNativeTabIconSources } from '../navigation/nativeTabIconSources';
import { usesNativeTabBar } from '../navigation/usesNativeTabBar';
import { useServices, useUseCases } from '../providers/ContainerProvider';

const BOOTSTRAP_STEP_TIMEOUT_MS = 3_000;

async function withTimeout<T>(operation: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout`)), BOOTSTRAP_STEP_TIMEOUT_MS);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}

/** Single startup pass; network failure must never leave the app on a spinner. */
export function useBootstrap(): { readonly isReady: boolean } {
  const { restoreSession } = useUseCases();
  const { sessions, storage, offlineQueue, logger } = useServices();
  const [isReady, setIsReady] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async (): Promise<void> => {
      try {
        const stored = await withTimeout(
          storage.read<PersistedSettings>(storageKeys.settings),
          'settings restore',
        );
        if (stored !== null) useSettingsStore.getState().hydrate(stored);
      } catch (error) {
        logger.debug('Не удалось восстановить настройки', { error: String(error) });
      }

      try {
        const reduceMotion = await withTimeout(
          AccessibilityInfo.isReduceMotionEnabled(),
          'accessibility settings',
        );
        if (reduceMotion) useSettingsStore.getState().setReduceMotion(true);
      } catch (error) {
        logger.debug('Не удалось прочитать настройку анимаций', { error: String(error) });
      }

      try {
        const session = await withTimeout(restoreSession(), 'session restore');
        sessions.adopt(session);
        useAuthStore.getState().setSession(session);
      } catch (error) {
        logger.warn('Сессия не восстановлена, показываю приложение как anonymous', {
          error: String(toAppError(error).message),
        });
        useAuthStore.getState().setStatus('anonymous');
      }

      if (usesNativeTabBar()) {
        try {
          await withTimeout(loadNativeTabIconSources(), 'native tab icons');
        } catch (error) {
          logger.debug('Не удалось подготовить иконки вкладок', { error: String(error) });
        }
      }

      void offlineQueue.flush();
      setIsReady(true);
    };

    void run();
  }, [restoreSession, sessions, storage, offlineQueue, logger]);

  useEffect(
    () =>
      useSettingsStore.subscribe((state) => {
        void storage.write(storageKeys.settings, persistedSettings(state));
      }),
    [storage],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void offlineQueue.flush();
    });
    return () => subscription.remove();
  }, [offlineQueue]);

  return { isReady };
}
