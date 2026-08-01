import { ValidationError } from '@/shared/errors';
import type { Brand } from '@/shared/types/Brand';

export type SurfaceId = Brand<string, 'SurfaceId'>;

export function surfaceId(value: string): SurfaceId {
  if (value.length === 0) {
    throw new ValidationError('Идентификатор поверхности не может быть пустым');
  }

  return value as SurfaceId;
}
