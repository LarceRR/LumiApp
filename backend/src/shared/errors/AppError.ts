/**
 * Root of the error hierarchy. Every failure the API can produce is one of these,
 * so the HTTP filter maps errors in exactly one place and the frontend receives a
 * stable `kind` instead of parsing messages.
 */
export type AppErrorKind =
  | 'validation'
  | 'domain'
  | 'infrastructure'
  | 'authentication'
  | 'authorization'
  | 'notFound'
  | 'conflict'
  | 'unknown';

export type ErrorContext = Readonly<Record<string, unknown>>;

export abstract class AppError extends Error {
  abstract readonly kind: AppErrorKind;
  abstract readonly httpStatus: number;

  readonly context: ErrorContext;
  readonly origin: unknown;

  constructor(message: string, context: ErrorContext = {}, origin?: unknown) {
    super(message);
    this.name = new.target.name;
    this.context = context;
    this.origin = origin;
    Error.captureStackTrace?.(this, new.target);
  }

  /** Only what is safe to send to a client. */
  toPublicJson(): { kind: AppErrorKind; message: string; details?: ErrorContext } {
    return { kind: this.kind, message: this.message };
  }
}
