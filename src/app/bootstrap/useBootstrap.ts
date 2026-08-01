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

/**
 * Single startup pass: restore the session, hydrate settings, respect the OS
 * reduce-motion preference, and flush anything queued while offline. Runs once,
 * not as a reaction to render.
 */
export function useBootstrap(): { readonly isReady: boolean } {
  const { restoreSession } = useUseCases();
  const { sessions, storage, offlineQueue, logger } = useServices();
  const [isReady, setIsReady] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    const run = async (): Promise<void> => {
      const stored = await storage.read<PersistedSettings>(storageKeys.settings);

      if (stored !== null) {
        useSettingsStore.getState().hydrate(stored);
      }

      try {
        const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
        if (reduceMotion) {
          useSettingsStore.getState().setReduceMotion(true);
        }
      } catch (error) {
        logger.debug('Не удалось прочитать настройку анимаций', { error: String(error) });
      }

      try {
        const session = await restoreSession();
        sessions.adopt(session);
        useAuthStore.getState().setSession(session);
      } catch (error) {
        logger.error('Не удалось восстановить сессию', toAppError(error));
        useAuthStore.getState().setStatus('anonymous');
      }

      if (usesNativeTabBar()) {
        try {
          await loadNativeTabIconSources();
        } catch (error) {
          logger.error('Не удалось подготовить иконки вкладок', toAppError(error));
        }
      }

      void offlineQueue.flush();
      setIsReady(true);
    };

    void run();
  }, [restoreSession, sessions, storage, offlineQueue, logger]);

  // Persist settings whenever they change, without a save button.
  useEffect(
    () =>
      useSettingsStore.subscribe((state) => {
        void storage.write(storageKeys.settings, persistedSettings(state));
      }),
    [storage],
  );

  // Returning to the foreground is the cheapest reliable moment to drain the queue.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        void offlineQueue.flush();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [offlineQueue]);

  return { isReady };
}
