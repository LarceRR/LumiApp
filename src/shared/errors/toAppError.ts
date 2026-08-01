import { AppError, type AppErrorOptions } from './AppError';
import {
  ConflictError,
  ForbiddenError,
  NetworkError,
  UnauthorizedError,
  UnknownError,
  ValidationError,
} from './errors';

/** Maps transport status codes onto the application error hierarchy. */
export function errorFromStatus(status: number, message: string, body?: unknown): AppError {
  const options: AppErrorOptions | undefined =
    body === undefined ? undefined : { context: { body } };

  switch (status) {
    case 400:
    case 422:
      return new ValidationError(message, {}, options);
    case 401:
      return new UnauthorizedError(message, options);
    case 403:
      return new ForbiddenError(message, options);
    case 409:
      return new ConflictError(message, null, null, options);
    default:
      return new NetworkError(message, status, options);
  }
}

export function toAppError(cause: unknown): AppError {
  if (cause instanceof AppError) {
    return cause;
  }

  if (cause instanceof Error) {
    return new UnknownError(cause.message, { cause });
  }

  return new UnknownError('Неизвестная ошибка', { context: { cause } });
}
