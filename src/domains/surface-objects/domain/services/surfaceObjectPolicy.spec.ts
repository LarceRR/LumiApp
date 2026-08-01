import { describe, expect, it } from 'vitest';

import type { UserId } from '@/domains/auth/domain/value-objects/UserId';
import type { Space, SpaceType } from '@/domains/spaces/domain/entities/Space';
import type { SpaceId } from '@/domains/spaces/domain/value-objects/SpaceId';
import { AppError } from '@/shared/errors';

import { knownKinds } from '../value-objects/SurfaceObjectKind';
import { assertSubjectAllowed, defaultSubjectUserId } from './surfaceObjectPolicy';

const anna = 'user-anna' as UserId;
const ivan = 'user-ivan' as UserId;
const stranger = 'user-stranger' as UserId;

function makeSpace(type: SpaceType): Space {
  const memberIds = type === 'Personal' ? [anna] : [anna, ivan];

  return {
    id: 'space-1' as SpaceId,
    type,
    title: type === 'Personal' ? 'Личное' : 'Мы вдвоём',
    memberIds,
    members: memberIds.map((userId) => ({
      userId,
      role: userId === anna ? 'Owner' : 'Member',
      permissions: [],
      displayName: userId,
    })),
    createdAt: 0,
    version: 1,
  };
}

describe('кто может быть адресатом объекта', () => {
  it('в общем пространстве объект ставит второй партнёр', () => {
    expect(() =>
      assertSubjectAllowed({
        space: makeSpace('Shared'),
        kind: knownKinds.fire,
        createdByUserId: anna,
        subjectUserId: ivan,
      }),
    ).not.toThrow();
  });

  it('в общем пространстве нельзя поставить объект самому себе', () => {
    try {
      assertSubjectAllowed({
        space: makeSpace('Shared'),
        kind: knownKinds.fire,
        createdByUserId: anna,
        subjectUserId: anna,
      });
      expect.unreachable('ожидалась доменная ошибка');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).kind).toBe('domain');
    }
  });

  it('в личном пространстве объект адресован самому себе', () => {
    expect(() =>
      assertSubjectAllowed({
        space: makeSpace('Personal'),
        kind: knownKinds.fire,
        createdByUserId: anna,
        subjectUserId: anna,
      }),
    ).not.toThrow();
  });

  it('не даёт адресовать объект тому, кого нет в пространстве', () => {
    expect(() =>
      assertSubjectAllowed({
        space: makeSpace('Shared'),
        kind: knownKinds.fire,
        createdByUserId: anna,
        subjectUserId: stranger,
      }),
    ).toThrow(/не найден/);
  });
});

describe('адресат по умолчанию', () => {
  it('в общем пространстве — второй участник', () => {
    expect(defaultSubjectUserId(makeSpace('Shared'), anna)).toBe(ivan);
  });

  it('в личном пространстве — сам пользователь', () => {
    expect(defaultSubjectUserId(makeSpace('Personal'), anna)).toBe(anna);
  });
});
