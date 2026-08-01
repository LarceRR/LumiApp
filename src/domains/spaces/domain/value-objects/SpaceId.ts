import { ValidationError } from '@/shared/errors';
import type { Brand } from '@/shared/types/Brand';

export type SpaceId = Brand<string, 'SpaceId'>;

export function spaceId(value: string): SpaceId {
  if (value.length === 0) {
    throw new ValidationError('Идентификатор пространства не может быть пустым');
  }

  return value as SpaceId;
}
