import AsyncStorage from '@react-native-async-storage/async-storage';

import { toAppError } from '@/shared/errors';

export type KeyValueStorage = {
  read<T>(key: string): Promise<T | null>;
  write(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
};

/**
 * JSON document storage on top of AsyncStorage. Reads never throw: a corrupted
 * document is treated as absent so a bad write can't brick the app.
 */
export function createKeyValueStorage(onError?: (error: unknown) => void): KeyValueStorage {
  const report = (error: unknown): void => {
    onError?.(toAppError(error));
  };

  return {
    async read<T>(key: string): Promise<T | null> {
      try {
        const raw = await AsyncStorage.getItem(key);

        return raw === null ? null : (JSON.parse(raw) as T);
      } catch (error) {
        report(error);

        return null;
      }
    },

    async write(key: string, value: unknown): Promise<void> {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        report(error);
      }
    },

    async remove(key: string): Promise<void> {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        report(error);
      }
    },
  };
}
