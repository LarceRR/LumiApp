import { beforeEach, describe, expect, it, vi } from 'vitest';

import { storageKeys } from '@/app/config/constants';
import { ConflictError, NetworkError, ValidationError } from '@/shared/errors';
import { createMemoryStorage, createSilentLogger } from '@/test/fakes';

import { createOfflineQueue, type QueuedAction } from './offlineQueue';

function setup() {
  const storage = createMemoryStorage();
  const conflicts: QueuedAction[] = [];
  const queue = createOfflineQueue({
    storage,
    logger: createSilentLogger(),
    onConflict: (action) => conflicts.push(action),
  });

  return { storage, queue, conflicts };
}

describe('очередь офлайн-действий', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('переигрывает действие и убирает его после успеха', async () => {
    const { queue } = setup();
    const handler = vi.fn().mockResolvedValue(undefined);

    queue.register('createObject', handler);
    await queue.enqueue('createObject', { kind: 'Fire' });
    await queue.flush();

    expect(handler).toHaveBeenCalledWith({ kind: 'Fire' });
    expect(queue.size()).toBe(0);
  });

  it('переживает перезапуск приложения', async () => {
    const { storage, queue } = setup();

    await queue.enqueue('createObject', { kind: 'Fire' });

    const restored = createOfflineQueue({
      storage,
      logger: createSilentLogger(),
      onConflict: () => undefined,
    });
    const handler = vi.fn().mockResolvedValue(undefined);

    restored.register('createObject', handler);
    await restored.flush();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(storage.entries.has(storageKeys.offlineQueue)).toBe(true);
  });

  it('оставляет действие в очереди при сетевой ошибке', async () => {
    const { queue } = setup();
    const handler = vi.fn().mockRejectedValue(new NetworkError('Нет соединения'));

    queue.register('createObject', handler);
    await queue.enqueue('createObject', { kind: 'Fire' });
    await queue.flush();

    expect(queue.size()).toBe(1);
  });

  it('не повторяет действие раньше, чем истечёт backoff', async () => {
    const { queue } = setup();
    const handler = vi.fn().mockRejectedValue(new NetworkError('Нет соединения'));

    queue.register('createObject', handler);
    await queue.enqueue('createObject', { kind: 'Fire' });
    await queue.flush();
    await queue.flush();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('снимает действие при конфликте версий и сообщает о нём', async () => {
    const { queue, conflicts } = setup();
    const handler = vi.fn().mockRejectedValue(new ConflictError('Объект изменён'));

    queue.register('changeState', handler);
    await queue.enqueue('changeState', { objectId: 'object-1' });
    await queue.flush();

    // The server is the source of truth for `version`; retrying would be wrong.
    expect(queue.size()).toBe(0);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.kind).toBe('changeState');
  });

  it('снимает действие, отклонённое сервером по существу', async () => {
    const { queue } = setup();
    const handler = vi.fn().mockRejectedValue(new ValidationError('Некорректные данные'));

    queue.register('createObject', handler);
    await queue.enqueue('createObject', { kind: '' });
    await queue.flush();

    expect(queue.size()).toBe(0);
  });

  it('снимает действие, для которого нет обработчика', async () => {
    const { queue } = setup();

    await queue.enqueue('unknownAction', {});
    await queue.flush();

    expect(queue.size()).toBe(0);
  });

  it('сообщает подписчикам об изменении размера', async () => {
    const { queue } = setup();
    const sizes: number[] = [];

    const unsubscribe = queue.onChange((size) => sizes.push(size));

    // The first notification is the initial load of an empty stored queue.
    await queue.enqueue('createObject', { kind: 'Fire' });
    unsubscribe();
    await queue.enqueue('createObject', { kind: 'Cloud' });

    expect(sizes).toEqual([0, 1]);
    expect(queue.size()).toBe(2);
  });
});
