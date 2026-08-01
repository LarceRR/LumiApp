import type { KeyValueStorage } from '@/infrastructure/storage/keyValueStorage';
import type { Logger } from '@/shared/logger';

/** In-memory storage with the same read/write semantics as the AsyncStorage one. */
export function createMemoryStorage(): KeyValueStorage & { readonly entries: Map<string, string> } {
  const entries = new Map<string, string>();

  return {
    entries,
    async read<T>(key: string): Promise<T | null> {
      const raw = entries.get(key);

      return raw === undefined ? null : (JSON.parse(raw) as T);
    },
    async write(key: string, value: unknown): Promise<void> {
      entries.set(key, JSON.stringify(value));
    },
    async remove(key: string): Promise<void> {
      entries.delete(key);
    },
  };
}

export function createSilentLogger(): Logger {
  const logger: Logger = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    child: () => logger,
  };

  return logger;
}
