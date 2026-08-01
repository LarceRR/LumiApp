import { AppError, type AppErrorKind, type ErrorContext } from './AppError';

export type FieldViolation = { readonly path: string; readonly message: string };

export class ValidationError extends AppError {
  readonly kind: AppErrorKind = 'validation';
  readonly httpStatus = 400;
  readonly violations: readonly FieldViolation[];

  constructor(message: string, violations: readonly FieldViolation[] = [], context?: ErrorContext) {
    super(message, context);
    this.violations = violations;
  }

  override toPublicJson(): { kind: AppErrorKind; message: string; details?: ErrorContext } {
    return { kind: this.kind, message: this.message, details: { violations: this.violations } };
  }
}

/** A domain invariant was violated (e.g. an illegal state transition). */
export class DomainError extends AppError {
  readonly kind: AppErrorKind = 'domain';
  readonly httpStatus = 422;
}

/** Something outside the process failed: database, cache, queue, storage. */
export class InfrastructureError extends AppError {
  readonly kind: AppErrorKind = 'infrastructure';
  readonly httpStatus = 503;
}

export class AuthenticationError extends AppError {
  readonly kind: AppErrorKind = 'authentication';
  readonly httpStatus = 401;
}

export class AuthorizationError extends AppError {
  readonly kind: AppErrorKind = 'authorization';
  readonly httpStatus = 403;
}

export class NotFoundError extends AppError {
  readonly kind: AppErrorKind = 'notFound';
  readonly httpStatus = 404;
}

/** Optimistic locking mismatch. The client must refetch and retry. */
export class ConflictError extends AppError {
  readonly kind: AppErrorKind = 'conflict';
  readonly httpStatus = 409;
}

export class UnknownError extends AppError {
  readonly kind: AppErrorKind = 'unknown';
  readonly httpStatus = 500;

  override toPublicJson(): { kind: AppErrorKind; message: string } {
    // Never leak internals of an unexpected failure.
    return { kind: this.kind, message: 'Внутренняя ошибка сервера' };
  }
}

export function toAppError(value: unknown): AppError {
  if (value instanceof AppError) {
    return value;
  }

  if (value instanceof Error) {
    return new UnknownError(value.message, {}, value);
  }

  return new UnknownError('Неизвестная ошибка', { value: String(value) }, value);
}
