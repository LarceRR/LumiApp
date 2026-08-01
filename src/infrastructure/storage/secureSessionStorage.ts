import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { storageKeys } from '@/app/config/constants';
import type { AuthSession } from '@/domains/auth/domain/entities/AuthSession';
import type { SessionStorage } from '@/domains/auth/domain/repositories/AuthRepository';
import { userId } from '@/domains/auth/domain/value-objects/UserId';
import { toAppError } from '@/shared/errors';

type StoredSession = {
  readonly accessToken: unknown;
  readonly refreshToken: unknown;
  readonly expiresAt: unknown;
  readonly userId: unknown;
};

function decode(raw: string): AuthSession | null {
  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const candidate = parsed as StoredSession;

  if (
    typeof candidate.accessToken !== 'string' ||
    typeof candidate.refreshToken !== 'string' ||
    typeof candidate.expiresAt !== 'number' ||
    typeof candidate.userId !== 'string'
  ) {
    return null;
  }

  return {
    accessToken: candidate.accessToken,
    refreshToken: candidate.refreshToken,
    expiresAt: candidate.expiresAt,
    userId: userId(candidate.userId),
  };
}

/**
 * Tokens live only here. Secure Store is unavailable on web, where the app is a
 * development target only, so it degrades to an in-memory slot rather than
 * writing credentials to localStorage.
 */
export function createSecureSessionStorage(onError?: (error: unknown) => void): SessionStorage {
  const report = (error: unknown): void => {
    onError?.(toAppError(error));
  };

  if (Platform.OS === 'web') {
    let memory: AuthSession | null = null;

    return {
      read: async () => memory,
      write: async (session) => {
        memory = session;
      },
      clear: async () => {
        memory = null;
      },
    };
  }

  return {
    async read(): Promise<AuthSession | null> {
      try {
        const raw = await SecureStore.getItemAsync(storageKeys.authSession);

        return raw === null ? null : decode(raw);
      } catch (error) {
        report(error);

        return null;
      }
    },

    async write(session: AuthSession): Promise<void> {
      try {
        await SecureStore.setItemAsync(storageKeys.authSession, JSON.stringify(session), {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      } catch (error) {
        report(error);
      }
    },

    async clear(): Promise<void> {
      try {
        await SecureStore.deleteItemAsync(storageKeys.authSession);
      } catch (error) {
        report(error);
      }
    },
  };
}
