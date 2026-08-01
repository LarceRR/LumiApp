import { offlineQueueConfig, storageKeys } from '@/app/config/constants';
import { ConflictError, NetworkError, toAppError } from '@/shared/errors';
import type { Logger } from '@/shared/logger';
import { createLocalId } from '@/shared/utils/id';

import type { KeyValueStorage } from '../storage/keyValueStorage';

export type QueuedAction = {
  readonly id: string;
  readonly kind: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly attempts: number;
  readonly createdAt: number;
  readonly nextAttemptAt: number;
};

export type ActionHandler = (payload: Readonly<Record<string, unknown>>) => Promise<void>;

export type OfflineQueue = {
  enqueue(kind: string, payload: Readonly<Record<string, unknown>>): Promise<void>;
  register(kind: string, handler: ActionHandler): void;
  /** Replays every due action. Called on reconnect and after each mutation. */
  flush(): Promise<void>;
  size(): number;
  onChange(listener: (size: number) => void): () => void;
};

function backoffDelay(attempts: number): number {
  return Math.min(
    offlineQueueConfig.backoffBaseMs * 2 ** attempts,
    offlineQueueConfig.backoffMaxMs,
  );
}

/**
 * Write-behind queue for mutations made while offline. Conflicts are dropped
 * rather than retried: the surface is re-synced from the server, which is the
 * source of truth for `version`.
 */
export function createOfflineQueue(options: {
  readonly storage: KeyValueStorage;
  readonly logger: Logger;
  readonly onConflict: (action: QueuedAction) => void;
}): OfflineQueue {
  const log = options.logger.child('offline-queue');
  const handlers = new Map<string, ActionHandler>();
  const listeners = new Set<(size: number) => void>();

  let actions: QueuedAction[] = [];
  let loaded = false;
  let flushing = false;

  const notify = (): void => {
    for (const listener of listeners) {
      listener(actions.length);
    }
  };

  const persist = async (): Promise<void> => {
    await options.storage.write(storageKeys.offlineQueue, actions);
    notify();
  };

  const load = async (): Promise<void> => {
    if (loaded) {
      return;
    }

    actions = (await options.storage.read<QueuedAction[]>(storageKeys.offlineQueue)) ?? [];
    loaded = true;
    notify();
  };

  return {
    async enqueue(kind, payload) {
      await load();

      const now = Date.now();

      actions = [
        ...actions,
        {
          id: createLocalId('act'),
          kind,
          payload,
          attempts: 0,
          createdAt: now,
          nextAttemptAt: now,
        },
      ];

      await persist();
    },

    register(kind, handler) {
      handlers.set(kind, handler);
    },

    async flush() {
      if (flushing) {
        return;
      }

      flushing = true;

      try {
        await load();

        const now = Date.now();
        const due = actions.filter((action) => action.nextAttemptAt <= now);

        for (const action of due) {
          const handler = handlers.get(action.kind);

          if (handler === undefined) {
            log.warn('Нет обработчика для действия', { kind: action.kind });
            actions = actions.filter((candidate) => candidate.id !== action.id);
            continue;
          }

          try {
            await handler(action.payload);
            actions = actions.filter((candidate) => candidate.id !== action.id);
          } catch (error) {
            const appError = toAppError(error);

            if (appError instanceof ConflictError) {
              actions = actions.filter((candidate) => candidate.id !== action.id);
              options.onConflict(action);
              continue;
            }

            if (!(appError instanceof NetworkError)) {
              log.error('Действие отклонено сервером', appError, { kind: action.kind });
              actions = actions.filter((candidate) => candidate.id !== action.id);
              continue;
            }

            const attempts = action.attempts + 1;

            if (attempts >= offlineQueueConfig.maxAttempts) {
              log.error('Действие исчерпало попытки', appError, { kind: action.kind });
              actions = actions.filter((candidate) => candidate.id !== action.id);
              continue;
            }

            actions = actions.map((candidate) =>
              candidate.id === action.id
                ? { ...candidate, attempts, nextAttemptAt: Date.now() + backoffDelay(attempts) }
                : candidate,
            );
          }
        }

        await persist();
      } finally {
        flushing = false;
      }
    },

    size() {
      return actions.length;
    },

    onChange(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
