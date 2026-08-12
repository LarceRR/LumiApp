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
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const candidate = parsed as StoredSession;
    if (
      typeof candidate.accessToken !== 'string' ||
      typeof candidate.refreshToken !== 'string' ||
      typeof candidate.expiresAt !== 'number' ||
      typeof candidate.userId !== 'string'
    )
      return null;
    return {
      accessToken: candidate.accessToken,
      refreshToken: candidate.refreshToken,
      expiresAt: candidate.expiresAt,
      userId: userId(candidate.userId),
    };
  } catch {
    return null;
  }
}

/** SecureStore on native, localStorage on web. */
export function createSecureSessionStorage(onError?: (error: unknown) => void): SessionStorage {
  const report = (error: unknown): void => onError?.(toAppError(error));

  if (Platform.OS === 'web') {
    return {
      read: async () => {
        try {
          const raw = globalThis.localStorage.getItem(storageKeys.authSession);
          return raw === null ? null : decode(raw);
        } catch (error) {
          report(error);
          return null;
        }
      },
      write: async (session) => {
        try {
          globalThis.localStorage.setItem(storageKeys.authSession, JSON.stringify(session));
        } catch (error) {
          report(error);
        }
      },
      clear: async () => {
        try {
          globalThis.localStorage.removeItem(storageKeys.authSession);
        } catch (error) {
          report(error);
        }
      },
    };
  }

  return {
    async read() {
      try {
        const raw = await SecureStore.getItemAsync(storageKeys.authSession);
        return raw === null ? null : decode(raw);
      } catch (error) {
        report(error);
        return null;
      }
    },
    async write(session) {
      try {
        await SecureStore.setItemAsync(storageKeys.authSession, JSON.stringify(session), {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      } catch (error) {
        report(error);
      }
    },
    async clear() {
      try {
        await SecureStore.deleteItemAsync(storageKeys.authSession);
      } catch (error) {
        report(error);
      }
    },
  };
}
