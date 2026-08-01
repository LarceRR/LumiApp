import { ValidationError } from '@/shared/errors';
import type { Brand } from '@/shared/types/Brand';

export type SurfaceObjectId = Brand<string, 'SurfaceObjectId'>;

export function surfaceObjectId(value: string): SurfaceObjectId {
  if (value.length === 0) {
    throw new ValidationError('Идентификатор объекта не может быть пустым');
  }

  return value as SurfaceObjectId;
}
