import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LIMIT_DEFINITIONS, type AppLimits, loadLimits } from './limits';

function readPath(limits: AppLimits, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (accumulator, segment) => (accumulator as Record<string, unknown> | undefined)?.[segment],
      limits,
    );
}

describe('реестр лимитов (#38)', () => {
  it('не содержит дублирующихся ключей и путей', () => {
    const keys = LIMIT_DEFINITIONS.map((definition) => definition.key);
    const paths = LIMIT_DEFINITIONS.map((definition) => definition.path);

    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('держит production-значение внутри допустимого диапазона', () => {
    for (const definition of LIMIT_DEFINITIONS) {
      expect(definition.min).toBeLessThanOrEqual(definition.max);
      expect(definition.production).toBeGreaterThanOrEqual(definition.min);
      expect(definition.production).toBeLessThanOrEqual(definition.max);
    }
  });

  it('на пустом окружении отдаёт production-значения по каждому пути', () => {
    const limits = loadLimits({});

    for (const definition of LIMIT_DEFINITIONS) {
      expect(readPath(limits, definition.path), definition.path).toBe(definition.production);
    }
  });

  it('позволяет переопределить лимит переменной окружения без релиза клиента', () => {
    const limits = loadLimits({ LIMIT_MOMENT_TEXT_MAX_LENGTH: '512', LIMIT_AI_REQUESTS_PER_USER_PER_DAY: '5' });

    expect(limits.moments.textMaxLength).toBe(512);
    expect(limits.ai.requestsPerUserPerDay).toBe(5);
  });

  it.each([
    ['0', 'ниже минимума'],
    ['999999999', 'выше максимума'],
    ['abc', 'не число'],
    ['', 'пустое значение'],
    ['12.5', 'не целое'],
  ])('падает на некорректном значении (%s: %s)', (value) => {
    expect(() => loadLimits({ LIMIT_MOMENT_TEXT_MAX_LENGTH: value })).toThrow(/LIMIT_MOMENT_TEXT_MAX_LENGTH/);
  });

  it('не печатает значения окружения в тексте ошибки', () => {
    let message = '';

    try {
      loadLimits({ LIMIT_MOMENT_TEXT_MAX_LENGTH: 'abc', JWT_ACCESS_SECRET: 'super-secret-value' });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain('LIMIT_MOMENT_TEXT_MAX_LENGTH');
    expect(message).not.toContain('super-secret-value');
  });

  it('совпадает с матрицей в docs/limits.md', () => {
    const documentPath = resolve(process.cwd(), '../docs/limits.md');

    expect(existsSync(documentPath), 'docs/limits.md должен существовать').toBe(true);

    const document = readFileSync(documentPath, 'utf8');
    const documented = new Set(
      [...document.matchAll(/`(LIMIT_[A-Z0-9_]+)`/g)].map((match) => match[1] ?? ''),
    );
    const defined = new Set(LIMIT_DEFINITIONS.map((definition) => definition.key));

    expect([...defined].filter((key) => !documented.has(key))).toEqual([]);
    expect([...documented].filter((key) => !defined.has(key))).toEqual([]);
  });

  it('документирует единицу измерения и владельца для каждого лимита', () => {
    for (const definition of LIMIT_DEFINITIONS) {
      expect(definition.unit.length, definition.key).toBeGreaterThan(0);
      expect(definition.owner.length, definition.key).toBeGreaterThan(0);
      expect(definition.description.length, definition.key).toBeGreaterThan(0);
    }
  });
});
