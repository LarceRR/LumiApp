import { ValidationError } from '@/shared/errors';
import type { Brand } from '@/shared/types/Brand';

export type UserId = Brand<string, 'UserId'>;

export function userId(value: string): UserId {
  if (value.length === 0) {
    throw new ValidationError('Идентификатор пользователя не может быть пустым');
  }

  return value as UserId;
}
