import { AppError, type AppErrorKind, type AppErrorOptions } from './AppError';

export type FieldViolations = Readonly<Record<string, readonly string[]>>;

export class ValidationError extends AppError {
  readonly kind: AppErrorKind = 'validation';

  readonly violations: FieldViolations;

  constructor(message: string, violations: FieldViolations = {}, options?: AppErrorOptions) {
    super(message, options);
    this.violations = violations;
  }

  override toJSON(): Readonly<Record<string, unknown>> {
    return { ...super.toJSON(), violations: this.violations };
  }
}

export class NetworkError extends AppError {
  readonly kind: AppErrorKind = 'network';

  /** Absent when the request never reached the server (offline, DNS, timeout). */
  readonly status: number | null;

  constructor(message: string, status: number | null = null, options?: AppErrorOptions) {
    super(message, options);
    this.status = status;
  }

  override toJSON(): Readonly<Record<string, unknown>> {
    return { ...super.toJSON(), status: this.status };
  }
}

export class UnauthorizedError extends AppError {
  readonly kind: AppErrorKind = 'unauthorized';
}

export class ForbiddenError extends AppError {
  readonly kind: AppErrorKind = 'forbidden';
}

/** Optimistic locking failure: the aggregate moved on since the client read it. */
export class ConflictError extends AppError {
  readonly kind: AppErrorKind = 'conflict';

  readonly expectedVersion: number | null;

  readonly actualVersion: number | null;

  constructor(
    message: string,
    expectedVersion: number | null = null,
    actualVersion: number | null = null,
    options?: AppErrorOptions,
  ) {
    super(message, options);
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }

  override toJSON(): Readonly<Record<string, unknown>> {
    return {
      ...super.toJSON(),
      expectedVersion: this.expectedVersion,
      actualVersion: this.actualVersion,
    };
  }
}

/** Invariant violation raised by the domain layer (illegal state transition, etc). */
export class DomainError extends AppError {
  readonly kind: AppErrorKind = 'domain';
}

export class UnknownError extends AppError {
  readonly kind: AppErrorKind = 'unknown';
}
