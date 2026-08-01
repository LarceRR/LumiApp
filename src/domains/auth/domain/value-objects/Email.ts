import { ValidationError } from '@/shared/errors';
import type { Brand } from '@/shared/types/Brand';

export type Email = Brand<string, 'Email'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;

export function email(value: string): Email {
  const normalized = value.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalized)) {
    throw new ValidationError('Некорректный адрес электронной почты', {
      email: ['Проверьте формат адреса'],
    });
  }

  return normalized as Email;
}

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim().toLowerCase());
}
